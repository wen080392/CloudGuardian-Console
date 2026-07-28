import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/db';
import { remediationService } from '../services/remediationService';
import { validate } from '../middleware/validate';

const remediateSchema = z.object({
  body: z.object({
    projectId: z.string().min(1),
    filePath: z.string().min(1).max(1024),
    fixedCode: z.string().min(1).max(1_000_000),
  }),
});

const router = Router();

// GET /api/v1/vulnerabilities – Listar todas as vulnerabilidades do tenant
router.get('/', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });
  const { status, severity, resourceId } = req.query;

  try {
    const where: any = { tenantId };
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (resourceId) where.resourceId = resourceId;

    const vulnerabilities = await prisma.vulnerability.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json(vulnerabilities);
  } catch (error) {
    console.error('Erro ao buscar vulnerabilidades:', error);
    res.status(500).json({ error: 'Erro ao buscar vulnerabilidades' });
  }
});

// GET /api/v1/vulnerabilities/:id – Detalhes de uma vulnerabilidade
router.get('/:id', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });
  const id = String(req.params.id);

  try {
    const vuln = await prisma.vulnerability.findFirst({
      where: { id, tenantId },
    });

    if (!vuln) {
      return res.status(404).json({ error: 'Vulnerabilidade não encontrada' });
    }

    res.json(vuln);
  } catch (error) {
    console.error('Erro ao buscar vulnerabilidade:', error);
    res.status(500).json({ error: 'Erro ao buscar vulnerabilidade' });
  }
});

// POST /api/v1/vulnerabilities – Criar uma nova vulnerabilidade (pode ser usado pelo scanner)
router.post('/', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });
  
  const { resourceId, ruleId, title, description, severity, filePath, line, details } = req.body;

  try {
    const newVuln = await prisma.vulnerability.create({
      data: {
        resourceId,
        ruleId,
        title,
        description,
        severity,
        filePath,
        line,
        details,
        tenantId,
        status: 'open',
      },
    });
    res.status(201).json(newVuln);
  } catch (error) {
    console.error('Erro ao criar vulnerabilidade:', error);
    res.status(500).json({ error: 'Erro ao criar vulnerabilidade' });
  }
});

// PATCH /api/v1/vulnerabilities/:id – Atualizar status (ex: marcar como fixed)
router.patch('/:id', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });
  const id = String(req.params.id);
  const { status } = req.body;

  try {
    const updated = await prisma.vulnerability.updateMany({
      where: { id, tenantId },
      data: { status },
    });

    if (updated.count === 0) {
      return res.status(404).json({ error: 'Vulnerabilidade não encontrada' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar vulnerabilidade:', error);
    res.status(500).json({ error: 'Erro ao atualizar vulnerabilidade' });
  }
});

// POST /api/v1/vulnerabilities/:id/remediate – Abre PR automático com a correção
router.post('/:id/remediate', validate(remediateSchema), async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });
  const id = String(req.params.id);
  const { projectId, filePath, fixedCode } = req.body;

  try {
    const vuln = await prisma.vulnerability.findFirst({ where: { id, tenantId } });
    if (!vuln) return res.status(404).json({ error: 'Vulnerabilidade não encontrada' });

    const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });
    if (!project.repoUrl) {
      return res.status(400).json({ error: 'Projeto não tem repositório GitHub vinculado' });
    }

    const result = await remediationService.createFixPullRequest({
      repoUrl: project.repoUrl,
      filePath,
      fixedContent: fixedCode,
      vulnerability: {
        id: vuln.id,
        ruleId: vuln.ruleId,
        title: vuln.title,
        severity: vuln.severity,
        description: vuln.description,
      },
    });

    await prisma.vulnerability.updateMany({
      where: { id, tenantId },
      data: { status: 'remediation_pr_open', details: { ...(vuln.details as object ?? {}), remediationPr: result.prUrl } },
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Erro na auto-remediação:', error);
    const message = String(error?.message ?? '');
    if (message.includes('GITHUB_TOKEN')) {
      return res.status(503).json({ error: message });
    }
    res.status(500).json({ error: 'Falha ao criar PR de remediação' });
  }
});

export default router;
