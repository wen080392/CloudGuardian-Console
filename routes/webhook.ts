import express, { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../services/db';

const router = Router();

/**
 * Verifica a assinatura HMAC-SHA256 do webhook do GitHub de forma
 * timing-safe. Fail-closed: sem segredo configurado ou assinatura
 * ausente/divergente, retorna false (a requisição é rejeitada).
 */
export function verifyGithubSignature(rawBody: Buffer, signature?: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  // timingSafeEqual exige buffers do mesmo tamanho
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Webhook do GitHub App — assinatura SEMPRE verificada (fail-closed)
router.post('/github', express.raw({ type: 'application/json' }), async (req: Request, res: Response): Promise<any> => {
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  const event = req.headers['x-github-event'] as string;

  if (!verifyGithubSignature(req.body as Buffer, signature)) {
    return res.status(401).json({ error: 'Assinatura inválida' });
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

      // 2. Criar um registro de Scan
      const scan = await prisma.scan.create({
        data: {
          projectId: project.id,
          tenantId: project.tenantId,
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
        headSha: pull_request.head?.sha,
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
