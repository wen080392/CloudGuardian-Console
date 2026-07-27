import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';

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
  const { id } = req.params;

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
  const { id } = req.params;
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

export default router;
