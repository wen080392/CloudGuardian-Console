import { scannerService } from './scannerService';
import { prisma } from './db';
import fs from 'fs';
import os from 'os';
import path from 'path';
import util from 'util';
import { execFile } from 'child_process';
import { App } from 'octokit';
import { ReportService } from './reportService';
import { uploadPDF } from './storageService';

const execFilePromise = util.promisify(execFile);
const mkdtempPromise = util.promisify(fs.mkdtemp);
const rmPromise = util.promisify(fs.rm);
const reportService = new ReportService();

// Fila em Memória
// Em um ambiente de produção real, isso seria BullMQ + Redis.
// Para este ambiente rodar de forma self-contained, usamos um processor em memória que simula a fila.
type Job = {
  type: string;
  data: any;
  id: string;
  resolve?: () => void;
  reject?: (e: unknown) => void;
};
const queue: Job[] = [];
let processing = false;

export const addScanJob = (data: any) => {
  const jobId = `job-${Date.now()}`;
  queue.push({ type: 'scan', data, id: jobId });
  console.log(`[Queue] Added scan job ${jobId}`);
  processQueue();
};

/**
 * Enfileira um scan de conteúdo Terraform (ad-hoc, vindo da UI).
 * Retorna uma promise resolvida quando o worker terminar o job,
 * permitindo que o endpoint aguarde com timeout e caia para polling.
 */
export const addContentScanJob = (data: { scanId: string; tenantId: string; content: string }) => {
  const jobId = `job-${Date.now()}`;
  const done = new Promise<void>((resolve, reject) => {
    queue.push({ type: 'content-scan', data, id: jobId, resolve, reject });
  });
  console.log(`[Queue] Added content-scan job ${jobId} (scan ${data.scanId})`);
  processQueue();
  return { jobId, done };
};

export const addReportJob = (data: any) => {
  const jobId = `job-${Date.now()}`;
  queue.push({ type: 'report', data, id: jobId });
  console.log(`[Queue] Added report job ${jobId}`);
  processQueue();
};

const processQueue = async () => {
  if (processing || queue.length === 0) return;
  processing = true;

  while (queue.length > 0) {
    const job = queue.shift();
    if (!job) continue;

    console.log(`[Queue] Processing ${job.type} job ${job.id}`);
    try {
      if (job.type === 'scan') await processScanJob(job.data);
      if (job.type === 'content-scan') await processContentScanJob(job.data);
      if (job.type === 'report') await processReportJob(job.data);
      job.resolve?.();
    } catch (e) {
      console.error(`[Queue] Error processing job ${job.id}:`, e);
      job.reject?.(e);
    }
  }

  processing = false;
};

// Worker de Scan
async function processScanJob(data: any) {
  const { scanId, projectId, tenantId, repoFullName, prNumber, installationId, repoUrl } = data;
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

    if (process.env.GITHUB_APP_ID && process.env.GITHUB_PRIVATE_KEY_PATH && installationId) {
        try {
            const app = new App({
                appId: process.env.GITHUB_APP_ID,
                privateKey: fs.readFileSync(process.env.GITHUB_PRIVATE_KEY_PATH, 'utf8'),
            });
            const octokit = await app.getInstallationOctokit(installationId);
            const [owner, repo] = repoFullName?.split('/') || [];

            let comment = `## 🔍 CloudGuardian Security Scan\n\n> Engine: \`${result.engine}\`\n\n✅ **${result.passed}** checks passed\n❌ **${result.failed}** violations found\n\n`;
            if (result.failed > 0) {
                comment += `### 🔴 Violações Detectadas:\n`;
                result.vulnerabilities.slice(0, 5).forEach((v) => {
                comment += `- **${v.title}** (${v.severity}): ${v.filePath || 'N/A'}\n`;
                });
                if (result.failed > 5) comment += `\n... e mais ${result.failed - 5} violações.`;
            } else {
                comment += `\n🎉 Nenhuma violação encontrada!`;
            }
            if (owner && repo) {
                await octokit.rest.issues.createComment({ owner, repo, issue_number: pr, body: comment });
            }
        } catch(e) {
            console.error("Github comment failed", e);
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
