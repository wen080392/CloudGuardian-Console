import { scannerService } from './scannerService';
import { prisma } from './db';
import fs from 'fs';
import os from 'os';
import path from 'path';
import util from 'util';
import { execFile } from 'child_process';
import { ReportService } from './reportService';
import { uploadPDF } from './storageService';
import { githubAppService, buildCheckRunPayload } from './githubAppService';

const execFilePromise = util.promisify(execFile);
const mkdtempPromise = util.promisify(fs.mkdtemp);
const rmPromise = util.promisify(fs.rm);
const reportService = new ReportService();

// A fila usa um driver plugável: in-memory por padrão, BullMQ/Redis quando
// REDIS_URL está definido (ver services/queue/).
import { getQueueDriver, type JobType } from './queue';

const driver = getQueueDriver();
driver.process(async (type: JobType, data: any) => {
  if (type === 'scan') return processScanJob(data);
  if (type === 'content-scan') return processContentScanJob(data);
  if (type === 'report') return processReportJob(data);
});

export const addScanJob = (data: any) => {
  driver.add('scan', data);
};

/**
 * Enfileira um scan de conteúdo Terraform (ad-hoc, vindo da UI).
 * Retorna uma promise resolvida quando o worker terminar o job,
 * permitindo que o endpoint aguarde com timeout e caia para polling.
 */
export const addContentScanJob = (data: { scanId: string; tenantId: string; content: string }) => {
  return driver.add('content-scan', data);
};

export const addReportJob = (data: any) => {
  driver.add('report', data);
};

// Worker de Scan
async function processScanJob(data: any) {
  const { scanId, projectId, tenantId, repoFullName, prNumber, headSha, installationId, repoUrl } = data;
  let repoPath = '';
  try {
    await prisma.scan.update({ where: { id: scanId }, data: { status: 'running', startedAt: new Date() } });

    // Valida entradas antes de tocar no shell (evita command injection via payload)
    const pr = Number(prNumber);
    if (!Number.isInteger(pr) || pr <= 0) throw new Error('prNumber inválido');
    if (typeof repoUrl !== 'string' || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(repoUrl)) {
      throw new Error('repoUrl inválida');
    }

    repoPath = await mkdtempPromise(path.join(os.tmpdir(), 'cg-pr-'));
    // execFile (sem shell) + argumentos separados: nada é interpretado pelo shell
    await execFilePromise('git', ['clone', '--depth', '1', `${repoUrl}.git`, repoPath]);
    await execFilePromise('git', ['-C', repoPath, 'fetch', 'origin', `pull/${pr}/head:pr-${pr}`]);
    await execFilePromise('git', ['-C', repoPath, 'checkout', `pr-${pr}`]);

    const result = await scannerService.runCheckovAndSave(projectId, tenantId, repoPath);
    await prisma.scan.update({ where: { id: scanId }, data: { engine: result.engine } });

    // Publica um Check Run (status que pode bloquear o merge) quando o
    // GitHub App está configurado e temos o SHA do head da PR
    if (githubAppService.isConfigured() && installationId && headSha) {
      try {
        const [owner, repo] = repoFullName?.split('/') || [];
        if (owner && repo) {
          const payload = buildCheckRunPayload({
            headSha,
            engine: result.engine,
            passed: result.passed,
            failed: result.failed,
            vulnerabilities: result.vulnerabilities.map(v => ({
              title: v.title, severity: v.severity, filePath: v.filePath,
              line: v.line, description: v.description, ruleId: v.ruleId,
            })),
          });
          await githubAppService.postCheckRun({ installationId, owner, repo, payload });
        }
      } catch (e) {
        console.error('GitHub Check Run failed', e);
      }
    }

    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'completed',
        finishedAt: new Date(),
        vulnsCount: result.failed,
        result: { engine: result.engine, prNumber: pr, repoFullName, passed: result.passed, failed: result.failed, vulnerabilities: result.vulnerabilities } as any,
      }
    });
    console.log(`✅ Scan ${scanId} finalizado pelo worker (engine: ${result.engine}).`);
  } catch (error: any) {
    console.error(`❌ Scan ${scanId} falhou no worker:`, error);
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'failed', finishedAt: new Date(), error: String(error?.message || error) },
    }).catch(() => {});
  } finally {
    if (repoPath) await rmPromise(repoPath, { recursive: true, force: true }).catch(() => {});
  }
}

// Worker de scan de conteúdo Terraform (ad-hoc, sem clone de repositório)
async function processContentScanJob(data: { scanId: string; tenantId: string; content: string }) {
  const { scanId, tenantId, content } = data;
  try {
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'running', startedAt: new Date() },
    });

    const outcome = await scannerService.analyzeAndPersist(content, tenantId);

    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'completed',
        engine: outcome.engine,
        finishedAt: new Date(),
        vulnsCount: outcome.vulnerabilities.length,
        result: { engine: outcome.engine, security_issues: outcome.vulnerabilities } as any,
      },
    });
    console.log(`✅ Content scan ${scanId} finalizado pelo worker.`);
  } catch (error: any) {
    console.error(`❌ Content scan ${scanId} falhou no worker:`, error);
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        error: String(error?.message || error),
      },
    }).catch(() => {});
    throw error;
  }
}

// Worker de Relatórios
async function processReportJob(data: any) {
    const { tenantId, framework, period } = data;
    try {
        const { report, pdfBuffer } = await reportService.generateReport(tenantId, framework, period);
        const key = `reports/${tenantId}/${framework}/${Date.now()}.pdf`;
        await uploadPDF(key, pdfBuffer);
        await prisma.complianceReport.update({
          where: { id: report.id },
          data: { pdfUrl: key },
        });
        console.log(`✅ Relatório ${framework} gerado pelo worker para tenant ${tenantId}.`);
    } catch (e) {
        console.error(`❌ Falha no job de relatório para tenant ${tenantId}`, e);
    }
}
