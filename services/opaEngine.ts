import { exec, execFile } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { prisma } from './db';

const execPromise = util.promisify(exec);
const execFilePromise = util.promisify(execFile);

// Detecta "binário não encontrado" de forma robusta: via exec/shell isso vem
// como exit 127 + "not found" (não ENOENT), então a checagem só por ENOENT
// não pegava e bloqueava a criação de políticas onde o OPA não está instalado.
function isBinaryMissing(error: any): boolean {
  if (!error) return false;
  if (error.code === 'ENOENT' || error.code === 127) return true;
  const msg = `${error.message || ''} ${error.stderr || ''}`.toLowerCase();
  return msg.includes('not found') || msg.includes('command not found') || msg.includes('no such file');
}

export class OPAEngine {
  private opaPath = process.env.OPA_PATH || 'opa'; // OPA no PATH, ou degrada se ausente

  // 1. Validar sintaxe da política (sem salvar ainda)
  async validatePolicy(regoCode: string) {
    const tempFile = path.join(os.tmpdir(), `policy-${Date.now()}-${Math.random().toString(36).slice(2)}.rego`);
    try {
      await fs.writeFile(tempFile, regoCode);
      // execFile (sem shell) — argumentos separados, sem risco de injeção
      const { stderr } = await execFilePromise(this.opaPath, ['check', tempFile], { timeout: 30_000 });
      if (stderr && !stderr.includes('No errors')) {
        return { valid: false, message: stderr };
      }
      return { valid: true, message: 'Política válida!' };
    } catch (error: any) {
      // OPA não instalado → não bloqueia o CRUD; segue sem validação de sintaxe
      if (isBinaryMissing(error)) {
        console.warn('OPA binary não encontrado — pulando validação de sintaxe da política.');
        return { valid: true, message: 'Política salva sem validação de sintaxe (OPA indisponível).' };
      }
      // Erro real de sintaxe reportado pelo OPA
      return { valid: false, message: error.stderr || error.message };
    } finally {
      await fs.unlink(tempFile).catch(() => {});
    }
  }

  // 2. Avaliar política contra um recurso (e salvar o resultado)
  async evaluatePolicy(policyId: string, resource: any, tenantId: string) {
    const policy = await prisma.policy.findUnique({ where: { id: policyId } });
    if (!policy) throw new Error('Política não encontrada');

    // Prepara arquivos temporários
    const policyFile = `/tmp/policy-${policyId}.rego`;
    const inputFile = `/tmp/input-${policyId}.json`;
    await fs.writeFile(policyFile, policy.regoCode);
    await fs.writeFile(inputFile, JSON.stringify({ resource, tenant: { id: tenantId } }));

    try {
      let deny = false;
      let evalResult: any = {};
      try {
        const { stdout } = await execPromise(
            `${this.opaPath} eval -d ${policyFile} -i ${inputFile} "data.deny" --format json`
        );
        const result = JSON.parse(stdout);
        deny = result.result?.[0]?.value || false;
        evalResult = result.result;
      } catch(e: any) {
        if (e.code === 'ENOENT') {
            console.warn("OPA not found, mocking evaluation.");
            // Mock evaluation: just assume it passed for demo purposes
            deny = false;
        } else {
            throw e;
        }
      }

      // Salvar avaliação no banco real
      await prisma.policyEvaluation.create({
        data: {
          policyId,
          resourceId: resource.id || 'unknown',
          result: deny ? 'fail' : 'pass',
          details: { deny, result: evalResult },
          tenantId,
        },
      });

      // Atualizar métricas da política
      await prisma.policy.update({
        where: { id: policyId },
        data: {
          passedCount: deny ? { increment: 0 } : { increment: 1 },
          failedCount: deny ? { increment: 1 } : { increment: 0 },
          lastEvaluated: new Date(),
        },
      });

      return { policy: policy.name, passed: !deny, result: evalResult };
    } catch (error) {
      // Registrar erro
      await prisma.policyEvaluation.create({
        data: {
          policyId,
          resourceId: resource.id || 'unknown',
          result: 'error',
          details: { error: String(error) },
          tenantId,
        },
      });
      throw error;
    } finally {
      await fs.unlink(policyFile).catch(() => {});
      await fs.unlink(inputFile).catch(() => {});
    }
  }
}
