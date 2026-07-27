import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';
import { FinOpsService } from '../services/finOpsService';

const router = Router();
const finOps = new FinOpsService();

// GET /api/v1/finops/dashboard – Dados resumidos para o dashboard
router.get('/dashboard', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });

  try {
    // Buscar a análise mais recente
    const latest = await prisma.costAnalysis.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    // Buscar alertas ativos
    const alerts = await prisma.budgetAlert.findMany({
      where: { tenantId, enabled: true, triggered: true },
    });

    // Recomendações top 5
    const latestRecs = latest?.recommendations as any[] || [];
    const topRecommendations = latestRecs.slice(0, 5);

    res.json({
      currentCost: latest?.totalCost || 0,
      projectedCost: latest?.projectedCost || 0,
      savings: latest?.savings || 0,
      efficiency: latest?.efficiency || 0,
      services: latest?.services || {},
      topRecommendations,
      activeAlerts: alerts,
      lastAnalysis: latest?.createdAt || null,
      analysisId: latest?.id || null,
    });
  } catch (error) {
    console.error('Erro no dashboard FinOps:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /api/v1/finops/analyses – Listar análises (com paginação)
router.get('/analyses', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });
  const { limit = 10, offset = 0 } = req.query;

  try {
    const analyses = await prisma.costAnalysis.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });
    res.json(analyses);
  } catch (error) {
    console.error('Erro ao listar análises:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/v1/finops/scan – Executar uma nova análise de custos
router.post('/scan', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });

  try {
    const analysis = await finOps.analyzeTenant(tenantId);
    res.json(analysis);
  } catch (error) {
    console.error('Erro no scan FinOps:', error);
    res.status(500).json({ error: 'Erro no scan' });
  }
});

// POST /api/v1/finops/budget-alerts – Criar alerta
router.post('/budget-alerts', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });
  const { name, description, threshold, period, comparison, channels, recipients } = req.body;

  try {
    const alert = await prisma.budgetAlert.create({
      data: {
        tenantId,
        name,
        description,
        threshold,
        period,
        comparison,
        channels,
        recipients,
      },
    });
    res.json(alert);
  } catch (error) {
    console.error('Erro ao criar alerta:', error);
    res.status(500).json({ error: 'Erro ao criar alerta' });
  }
});

// GET /api/v1/finops/budget-alerts – Listar alertas
router.get('/budget-alerts', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });
  try {
    const alerts = await prisma.budgetAlert.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(alerts);
  } catch (error) {
    console.error('Erro ao listar alertas:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
