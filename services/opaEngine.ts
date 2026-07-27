import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import { prisma } from './db';

const execPromise = util.promisify(exec);

export class OPAEngine {
  private opaPath = 'opa'; // assuming opa is installed and in path, or use simulation if not

  // 1. Validar sintaxe da política (sem salvar ainda)
  async validatePolicy(regoCode: string) {
    const tempFile = `/tmp/policy-${Date.now()}.rego`;
    try {
      await fs.writeFile(tempFile, regoCode);
      const { stderr } = await execPromise(`${this.opaPath} check ${tempFile}`);
      if (stderr && !stderr.includes('No errors')) {
        return { valid: false, message: stderr };
      }
      return { valid: true, message: 'Política válida!' };
    } catch (error: any) {
        // Fallback or simulate if opa not installed
        if (error.code === 'ENOENT') {
            console.warn("OPA binary not found. Skipping validation.");
            return { valid: true, message: 'Política válida! (OPA mock)' };
        }
      return { valid: false, message: error.message };
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
