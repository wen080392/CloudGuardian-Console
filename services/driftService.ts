import { execFile } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';
import { prisma } from './db';
import { parseTerraformDrift, severityForDrift, type DriftSource, type ParsedDrift } from './driftParser';

export { parseTerraformDrift } from './driftParser';
export type { DriftSource, ParsedDrift } from './driftParser';

const execFileAsync = promisify(execFile);
const mkdtempAsync = promisify(fs.mkdtemp);
const rmAsync = promisify(fs.rm);

export class DriftService {
  /** terraform disponível no PATH? */
  async terraformAvailable(): Promise<boolean> {
    try {
      await execFileAsync('terraform', ['version'], { timeout: 10_000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Roda `terraform plan -refresh-only` no repositório do projeto e persiste
   * os drifts detectados. Requer terraform + credenciais de cloud + estado
   * acessível. Retorna os drifts (fonte `terraform-refresh`).
   *
   * NÃO fabrica dados: se o terraform não estiver disponível, lança — o
   * chamador decide se cai para a visão derivada (claramente rotulada).
   */
  async detectDrift(params: {
    tenantId: string;
    projectId: string;
    repoUrl: string;
    workingDir?: string;
    env?: NodeJS.ProcessEnv;
  }): Promise<{ source: DriftSource; drifts: ParsedDrift[] }> {
    if (!(await this.terraformAvailable())) {
      throw new Error('terraform não disponível no runner — drift real indisponível.');
    }

    const dir = await mkdtempAsync(path.join(os.tmpdir(), 'cg-drift-'));
    try {
      if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(params.repoUrl)) {
        throw new Error('repoUrl inválida');
      }
      await execFileAsync('git', ['clone', '--depth', '1', `${params.repoUrl}.git`, dir], { timeout: 120_000 });
      const cwd = params.workingDir ? path.join(dir, params.workingDir) : dir;
      const env = { ...process.env, ...params.env };

      await execFileAsync('terraform', ['init', '-input=false', '-no-color'], { cwd, env, timeout: 300_000 });
      const planFile = path.join(dir, 'drift.tfplan');
      await execFileAsync(
        'terraform',
        ['plan', '-refresh-only', '-input=false', '-no-color', `-out=${planFile}`],
        { cwd, env, timeout: 300_000 }
      );
      const { stdout } = await execFileAsync('terraform', ['show', '-json', planFile], {
        cwd, env, timeout: 120_000, maxBuffer: 50 * 1024 * 1024,
      });

      const drifts = parseTerraformDrift(JSON.parse(stdout));
      await this.persist(params.tenantId, params.projectId, drifts, 'terraform-refresh');
      return { source: 'terraform-refresh', drifts };
    } finally {
      await rmAsync(dir, { recursive: true, force: true }).catch(() => {});
    }
  }

  private async persist(
    tenantId: string,
    projectId: string,
    drifts: ParsedDrift[],
    source: DriftSource
  ): Promise<void> {
    if (drifts.length === 0) return;
    await prisma.drift.createMany({
      data: drifts.map(d => ({
        tenantId,
        projectId,
        resource: d.resource,
        driftType: d.driftType,
        provider: d.provider,
        severity: severityForDrift(d.driftType),
        source,
        expected: (d.expected ?? undefined) as any,
        actual: (d.actual ?? undefined) as any,
      })),
    });
  }
}

export const driftService = new DriftService();
