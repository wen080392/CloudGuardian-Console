import { scannerService } from './scannerService';
import { prisma } from './db';
import fs from 'fs';
import util from 'util';
import { exec } from 'child_process';
import { App } from 'octokit';
import { ReportService } from './reportService';
import { uploadPDF } from './storageService';

const execPromise = util.promisify(exec);
const reportService = new ReportService();

// Fila em Memória
// Em um ambiente de produção real, isso seria BullMQ + Redis.
// Para este ambiente rodar de forma self-contained, usamos um processor em memória que simula a fila.
type Job = { type: string; data: any; id: string };
const queue: Job[] = [];
let processing = false;

export const addScanJob = (data: any) => {
  const jobId = `job-${Date.now()}`;
  queue.push({ type: 'scan', data, id: jobId });
  console.log(`[Queue] Added scan job ${jobId}`);
  processQueue();
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
      if (job.type === 'report') await processReportJob(job.data);
    } catch (e) {
      console.error(`[Queue] Error processing job ${job.id}:`, e);
    }
  }

  processing = false;
};

// Worker de Scan
async function processScanJob(data: any) {
  const { scanId, projectId, tenantId, repoFullName, prNumber, installationId, repoUrl } = data;
  try {
    await prisma.scan.update({ where: { id: scanId }, data: { status: 'running' } });

    const repoPath = `/tmp/${repoFullName?.replace('/', '_')}_${prNumber}_${Date.now()}`;
    await execPromise(`rm -rf ${repoPath}`);
    await execPromise(`git clone ${repoUrl}.git ${repoPath}`);
    await execPromise(`git -C ${repoPath} fetch origin pull/${prNumber}/head:pr-${prNumber}`);
    await execPromise(`git -C ${repoPath} checkout pr-${prNumber}`);

    const result = await scannerService.runCheckovAndSave(projectId, tenantId, repoPath);

    if (process.env.GITHUB_APP_ID && process.env.GITHUB_PRIVATE_KEY_PATH && installationId) {
        try {
            const app = new App({
                appId: process.env.GITHUB_APP_ID,
                privateKey: fs.readFileSync(process.env.GITHUB_PRIVATE_KEY_PATH, 'utf8'),
            });
            const octokit = await app.getInstallationOctokit(installationId);
            const [owner, repo] = repoFullName?.split('/') || [];

            let comment = `## 🔍 CloudGuardian Security Scan\n\n✅ **${result.passed}** checks passed\n❌ **${result.failed}** violations found\n\n`;
            if (result.failed > 0) {
                comment += `### 🔴 Violações Detectadas:\n`;
                result.vulnerabilities.slice(0, 5).forEach((v: any) => {
                comment += `- **${v.title}** (${v.severity}): ${v.filePath || 'N/A'}\n`;
                });
                if (result.failed > 5) comment += `\n... e mais ${result.failed - 5} violações.`;
            } else {
                comment += `\n🎉 Nenhuma violação encontrada!`;
            }
            if (owner && repo) {
                await octokit.rest.issues.createComment({ owner, repo, issue_number: prNumber, body: comment });
            }
        } catch(e) {
            console.error("Github comment failed", e);
        }
    }

    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'completed',
        result: { prNumber, repoFullName, passed: result.passed, failed: result.failed, vulnerabilities: result.vulnerabilities }
      }
    });
    console.log(`✅ Scan ${scanId} finalizado pelo worker.`);
  } catch (error) {
    console.error(`❌ Scan ${scanId} falhou no worker:`, error);
    await prisma.scan.update({ where: { id: scanId }, data: { status: 'failed' } });
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
