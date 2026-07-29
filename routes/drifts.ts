import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';
import { driftService } from '../services/driftService';

const router = Router();

// GET /api/v1/drifts - Lista drifts do tenant
// Retorna drifts REAIS (terraform-refresh) quando existirem. Se não houver
// nenhum registrado, devolve uma visão DERIVADA das vulnerabilidades abertas,
// sempre rotulada com `source` para que o front não a apresente como real.
router.get('/', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });

  try {
    const real = await prisma.drift.findMany({
      where: { tenantId, status: 'detected' },
      orderBy: { detectedAt: 'desc' },
      take: 50,
    });

    if (real.length > 0) {
      return res.json(real.map(d => ({
        id: d.id,
        resource: d.resource,
        type: d.driftType,
        provider: d.provider,
        severity: d.severity.toUpperCase(),
        status: d.status,
        expected: d.expected,
        actual: d.actual,
        detectedAt: d.detectedAt,
        source: d.source, // 'terraform-refresh'
      })));
    }

    // Sem drift real registrado — visão derivada, claramente rotulada
    const vulnerabilities = await prisma.vulnerability.findMany({
      where: { tenantId, status: 'open', severity: { in: ['critical', 'high'] } },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    const derived = vulnerabilities.map(v => ({
      id: `derived-${v.id.slice(0, 8)}`,
      resource: v.resourceId,
      type: 'configuration',
      severity: v.severity === 'critical' ? 'CRITICAL' : 'HIGH',
      status: 'detected',
      expected: 'Configuração conforme a definição IaC',
      actual: v.title,
      detectedAt: v.createdAt,
      source: 'derived', // NÃO é drift real de infraestrutura
    }));

    res.json(derived);
  } catch (error) {
    console.error('Error fetching drifts:', error);
    res.status(500).json({ error: 'Failed to fetch drifts' });
  }
});

// POST /api/v1/drifts/detect - Dispara detecção real via terraform (por projeto)
router.post('/detect', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });
  const { projectId } = req.body ?? {};

  try {
    const project = await prisma.project.findFirst({ where: { id: String(projectId), tenantId } });
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });
    if (!project.repoUrl) return res.status(400).json({ error: 'Projeto não tem repositório vinculado' });

    if (!(await driftService.terraformAvailable())) {
      return res.status(503).json({ error: 'terraform não disponível no runner — detecção de drift real indisponível.' });
    }

    const result = await driftService.detectDrift({
      tenantId,
      projectId: project.id,
      repoUrl: project.repoUrl,
    });
    res.json({ source: result.source, count: result.drifts.length, drifts: result.drifts });
  } catch (error: any) {
    console.error('Erro na detecção de drift:', error);
    res.status(500).json({ error: String(error?.message ?? 'Falha na detecção de drift') });
  }
});

// POST /api/v1/drifts/:id/resolve - Marca drift como resolvido
router.post('/:id/resolve', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });
  const id = String(req.params.id);

  try {
    const updated = await prisma.drift.updateMany({
      where: { id, tenantId },
      data: { status: 'resolved', resolvedAt: new Date() },
    });
    if (updated.count === 0) {
      // pode ser um id derivado (não persistido) — responde idempotente
      return res.json({ success: true, message: 'Drift resolvido' });
    }
    res.json({ success: true, message: 'Drift resolvido' });
  } catch (error) {
    console.error('Erro ao resolver drift:', error);
    res.status(500).json({ error: 'Falha ao resolver drift' });
  }
});

export default router;
