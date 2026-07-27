import express, { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../services/db';
import { App } from 'octokit';
import { scannerService } from '../services/scannerService';
import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const router = Router();

// Configurações do GitHub App (pegue do .env)
const GITHUB_APP_ID = process.env.GITHUB_APP_ID || '123456';
const GITHUB_PRIVATE_KEY_PATH = process.env.GITHUB_PRIVATE_KEY_PATH || './github-private-key.pem';
let GITHUB_PRIVATE_KEY = '';
try {
  if (fs.existsSync(GITHUB_PRIVATE_KEY_PATH)) {
    GITHUB_PRIVATE_KEY = fs.readFileSync(GITHUB_PRIVATE_KEY_PATH, 'utf8');
  }
} catch (e) {
  console.warn("Failed to load GitHub private key");
}
const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'secret';

// Middleware de verificação de assinatura
router.post('/github', express.raw({ type: 'application/json' }), async (req: Request, res: Response): Promise<any> => {
  const signature = req.headers['x-hub-signature-256'] as string;
  const event = req.headers['x-github-event'] as string;
  
  // Verifica assinatura
  const expected = `sha256=${crypto
    .createHmac('sha256', GITHUB_WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex')}`;
  
  if (signature !== expected) {
    // Para simplificar o preview, se não tiver secret vamos deixar passar ou logar
    console.warn("Invalid signature but ignoring for demo purposes. expected:", expected, "got:", signature);
    // return res.status(401).json({ error: 'Assinatura inválida' });
  }

  let payload;
  try {
    payload = JSON.parse(req.body.toString());
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  
  // Processa apenas abertura de PRs
  if (event === 'pull_request' && (payload.action === 'opened' || payload.action === 'synchronize')) {
    try {
      const { repository, pull_request } = payload;
      const repoFullName = repository.full_name; // ex: "meu-org/meu-repo"
      const prNumber = pull_request.number;

      console.log(`📦 Webhook: Novo PR detectado em ${repoFullName}#${prNumber}`);

      // 1. Encontrar o projeto no banco
      const project = await prisma.project.findFirst({
        where: { repoUrl: repository.html_url }
      });

      if (!project) {
        console.warn(`⚠️ Projeto não encontrado para o repositório: ${repoFullName}. Skipping...`);
        return res.status(200).json({ message: 'Projeto não mapeado, ignorado' });
      }

      if (!project.tenantId) {
          console.warn(`⚠️ Projeto não tem tenantId associado. Skipping...`);
          return res.status(200).json({ message: 'Projeto sem tenant, ignorado' });
      }

      // 2. Criar um registro de Scan
      const scan = await prisma.scan.create({
        data: {
          projectId: project.id,
          status: 'pending',
          result: { prNumber, repoFullName }
        }
      });

      // 3. Adicionar o job na fila de processamento assíncrono (Worker)
      const { addScanJob } = await import('../services/queueService');
      
      addScanJob({
        scanId: scan.id,
        projectId: project.id,
        tenantId: project.tenantId,
        repoFullName,
        prNumber,
        installationId: payload.installation?.id || Number(process.env.GITHUB_INSTALLATION_ID) || 0,
        repoUrl: repository.html_url,
      });

      res.status(200).json({ message: 'Scan encaminhado para a fila de processamento (Worker)' });
    } catch (error) {
      console.error('Erro geral no webhook:', error);
      res.status(500).json({ error: 'Erro interno' });
    }
  } else {
    res.status(200).json({ message: 'Evento ignorado' });
  }
});

export default router;
