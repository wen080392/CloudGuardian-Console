import { exec, execFile } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';
import { prisma } from './db';
import { NotificationService } from './notificationService';
import { scanTerraformNative, type NativeFinding } from './nativeEngine';
import { buildCheckovDockerArgs, checkovImage } from './checkovDocker';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);
const writeFileAsync = promisify(fs.writeFile);
const mkdtempAsync = promisify(fs.mkdtemp);
const rmAsync = promisify(fs.rm);

export type ScanEngine = 'checkov' | 'checkov-docker' | 'native';

export interface NormalizedVuln {
  resourceId: string;
  ruleId: string;
  title: string;
  description: string;
  severity: string;
  filePath: string | null;
  line: number | null;
  remediation: string;
  engine: ScanEngine;
  details: any;
}

export interface ScanOutcome {
  engine: ScanEngine;
  vulnerabilities: NormalizedVuln[];
  passed: number;
  failed: number;
}

export class ScannerService {
  /**
   * Escaneia conteúdo Terraform e persiste as vulnerabilidades.
   *
   * Estratégia de engine (nunca produz dado falso silenciosamente):
   *  1. Checkov em container Docker, se SCAN_RUNNER=docker
   *  2. Checkov no host, se disponível no PATH
   *  3. Motor nativo do CloudGuardian (rotulado como `native`)
   */
  async scanTerraform(code: string, tenantId: string): Promise<NormalizedVuln[]> {
    const outcome = await this.analyze(code);
    await this.persist(outcome.vulnerabilities, tenantId);
    return outcome.vulnerabilities;
  }

  /** Analisa e persiste, devolvendo o resultado completo (engine + contagens). */
  async analyzeAndPersist(code: string, tenantId: string): Promise<ScanOutcome> {
    const outcome = await this.analyze(code);
    await this.persist(outcome.vulnerabilities, tenantId);
    return outcome;
  }

  /** Executa a análise e devolve o resultado com o engine usado, sem persistir. */
  async analyze(code: string): Promise<ScanOutcome> {
    const runner = (process.env.SCAN_RUNNER || 'auto').toLowerCase();

    if (runner === 'docker') {
      return this.runCheckovDocker(code);
    }
    if (runner === 'checkov') {
      return this.runCheckovHost(code);
    }
    // auto: tenta Checkov no host; se indisponível, usa o engine nativo
    if (await this.checkovAvailable()) {
      return this.runCheckovHost(code);
    }
    return this.runNative(code);
  }

  private async checkovAvailable(): Promise<boolean> {
    try {
      await execFileAsync('checkov', ['--version'], { timeout: 10_000 });
      return true;
    } catch {
      return false;
    }
  }

  private runNative(code: string): ScanOutcome {
    const { findings, passed, failed } = scanTerraformNative(code);
    return {
      engine: 'native',
      vulnerabilities: findings.map(this.fromNative),
      passed,
      failed,
    };
  }

  private async runCheckovHost(code: string): Promise<ScanOutcome> {
    const dir = await mkdtempAsync(path.join(os.tmpdir(), 'cg-scan-'));
    const file = path.join(dir, 'main.tf');
    try {
      await writeFileAsync(file, code);
      let stdout = '';
      try {
        const r = await execFileAsync('checkov', ['-f', file, '-o', 'json', '--compact'], {
          timeout: 120_000,
          maxBuffer: 20 * 1024 * 1024,
        });
        stdout = r.stdout;
      } catch (e: any) {
        // Checkov sai com código != 0 quando encontra violações
        if (e?.stdout) stdout = e.stdout;
        else throw e;
      }
      return this.parseCheckov(stdout, 'checkov');
    } finally {
      await rmAsync(dir, { recursive: true, force: true }).catch(() => {});
    }
  }

  private async runCheckovDocker(code: string): Promise<ScanOutcome> {
    const dir = await mkdtempAsync(path.join(os.tmpdir(), 'cg-scan-'));
    try {
      await writeFileAsync(path.join(dir, 'main.tf'), code);
      return await this.runCheckovInDocker(dir);
    } finally {
      await rmAsync(dir, { recursive: true, force: true }).catch(() => {});
    }
  }

  /**
   * Executa o Checkov em um container isolado sobre `hostDir` (montado :ro).
   * Compartilhado pelos fluxos de snippet e de repositório. O chamador é dono
   * do ciclo de vida de `hostDir` (criação/limpeza).
   */
  private async runCheckovInDocker(hostDir: string): Promise<ScanOutcome> {
    const args = buildCheckovDockerArgs(hostDir, checkovImage());
    let stdout = '';
    try {
      const r = await execFileAsync('docker', args, {
        timeout: 300_000,
        maxBuffer: 40 * 1024 * 1024,
      });
      stdout = r.stdout;
    } catch (e: any) {
      // Checkov sai com código != 0 quando encontra violações — isso não é erro
      if (e?.stdout) stdout = e.stdout;
      else throw e;
    }
    return this.parseCheckov(stdout, 'checkov-docker');
  }

  /**
   * Escaneia um diretório clonado (fluxo do webhook de PR). Como o repositório
   * é NÃO confiável, com SCAN_RUNNER=docker o Checkov roda numa sandbox
   * isolada em vez de no host. Ordem: docker → checkov no host → engine nativo.
   */
  async runCheckovAndSave(_projectId: string, tenantId: string, repoPath: string): Promise<ScanOutcome> {
    const runner = (process.env.SCAN_RUNNER || 'auto').toLowerCase();
    let outcome: ScanOutcome;
    try {
      if (runner === 'docker') {
        outcome = await this.runCheckovInDocker(repoPath);
      } else {
        let stdout = '';
        try {
          const r = await execFileAsync('checkov', ['-d', repoPath, '-o', 'json', '--compact', '--quiet'], {
            timeout: 300_000,
            maxBuffer: 40 * 1024 * 1024,
          });
          stdout = r.stdout;
        } catch (e: any) {
          if (e?.stdout) stdout = e.stdout;
          else throw e;
        }
        outcome = this.parseCheckov(stdout, 'checkov');
      }
    } catch (error) {
      // Docker/Checkov indisponível: cai para o engine nativo lendo os .tf
      console.warn('Runner Checkov indisponível; usando engine nativo.', error);
      const code = this.readTerraformFiles(repoPath);
      outcome = this.runNative(code);
    }

    await this.persist(outcome.vulnerabilities, tenantId);

    const critical = outcome.vulnerabilities.filter(v => v.severity === 'critical');
    if (critical.length > 0) {
      try {
        const notificationService = new NotificationService();
        await notificationService.sendNotification(
          tenantId,
          'vulnerability',
          `🚨 ${critical.length} Vulnerabilidades Críticas Encontradas`,
          `Foram detectadas ${critical.length} vulnerabilidades críticas no scan recente (engine: ${outcome.engine}).`,
          critical.slice(0, 3)
        );
      } catch (e) {
        console.error('Failed to send vulnerability notification', e);
      }
    }
    return outcome;
  }

  private readTerraformFiles(dir: string): string {
    let code = '';
    const walk = (d: string) => {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === '.git' || entry.name === 'node_modules') continue;
          walk(full);
        } else if (entry.name.endsWith('.tf')) {
          code += fs.readFileSync(full, 'utf-8') + '\n';
        }
      }
    };
    try { walk(dir); } catch { /* diretório inacessível */ }
    return code;
  }

  private fromNative(f: NativeFinding): NormalizedVuln {
    return {
      resourceId: f.resource,
      ruleId: f.ruleId,
      title: f.title,
      description: f.description,
      severity: f.severity,
      filePath: null,
      line: f.line,
      remediation: f.remediation,
      engine: 'native',
      details: f,
    };
  }

  private parseCheckov(stdout: string, engine: ScanEngine): ScanOutcome {
    let results: any = {};
    try {
      results = JSON.parse(stdout || '{}');
    } catch {
      results = {};
    }
    const first = Array.isArray(results) ? results[0] : results;
    const failed: any[] = first?.results?.failed_checks || [];
    const passed: any[] = first?.results?.passed_checks || [];

    const vulnerabilities: NormalizedVuln[] = failed.map(check => ({
      resourceId: check.resource || 'unknown',
      ruleId: check.check_id || 'UNKNOWN_RULE',
      title: check.check_name || 'Vulnerabilidade detectada',
      description: `${check.check_id}: ${check.check_name}`,
      severity: this.mapSeverity(check.severity),
      filePath: check.file_path || null,
      line: check.file_line_range?.[0] ?? null,
      remediation: check.guideline || 'Consulte a documentação do CIS Benchmark.',
      engine,
      details: check,
    }));

    return { engine, vulnerabilities, passed: passed.length, failed: failed.length };
  }

  private async persist(vulns: NormalizedVuln[], tenantId: string): Promise<void> {
    if (!tenantId || vulns.length === 0) return;
    await prisma.vulnerability.createMany({
      data: vulns.map(v => ({
        tenantId,
        resourceId: v.resourceId,
        ruleId: v.ruleId,
        title: v.title,
        description: v.description,
        severity: v.severity,
        status: 'open',
        filePath: v.filePath,
        line: v.line,
        details: v.details,
      })),
      skipDuplicates: true,
    });
  }

  private mapSeverity(severity?: string): string {
    const map: Record<string, string> = {
      CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium', LOW: 'low',
    };
    return map[(severity || '').toUpperCase()] || 'medium';
  }
}

export const scannerService = new ScannerService();
