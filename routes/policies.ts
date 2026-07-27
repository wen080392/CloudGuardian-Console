import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';
import { OPAEngine } from '../services/opaEngine';

const router = Router();
const opa = new OPAEngine();

// GET /api/v1/policies – Listar políticas (com filtros)
router.get('/', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });
  const { framework, type, enabled } = req.query;

  try {
    const policies = await prisma.policy.findMany({
      where: {
        tenantId,
        framework: framework && framework !== 'all' ? String(framework) : undefined,
        type: type && type !== 'all' ? String(type) : undefined,
        enabled: enabled !== undefined && enabled !== 'all' ? enabled === 'true' : undefined,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(policies);
  } catch(error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});

// POST /api/v1/policies – Criar política
router.post('/', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });
  const { name, description, type, framework, severity, regoCode, autoRemediate, enabled } = req.body;

  // Validar antes de salvar
  const validation = await opa.validatePolicy(regoCode);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }

  try {
    const policy = await prisma.policy.create({
      data: { name, description, type, framework, severity, regoCode, autoRemediate: !!autoRemediate, enabled: enabled ?? true, tenantId },
    });
    res.status(201).json(policy);
  } catch (error) {
    console.error('Error creating policy:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});

// PUT /api/v1/policies/:id – Atualizar
router.put('/:id', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });
  const { id } = req.params;
  const updates = req.body;

  try {
    // Verificar se existe
    const existing = await prisma.policy.findFirst({ where: { id, tenantId } });
    if (!existing) return res.status(404).json({ error: 'Política não encontrada' });

    if (updates.regoCode) {
      const validation = await opa.validatePolicy(updates.regoCode);
      if (!validation.valid) return res.status(400).json({ error: validation.message });
    }

    const updated = await prisma.policy.update({ where: { id }, data: updates });
    res.json(updated);
  } catch(error) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// DELETE /api/v1/policies/:id – Excluir
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });
  const { id } = req.params;
  
  try {
    const existing = await prisma.policy.findFirst({ where: { id, tenantId } });
    if (!existing) return res.status(404).json({ error: 'Política não encontrada' });
    
    // Deletar avaliações primeiro
    await prisma.policyEvaluation.deleteMany({ where: { policyId: id } });
    await prisma.policy.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting policy:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});

// POST /api/v1/policies/validate - Validar sem salvar
router.post('/validate', async (req: Request, res: Response): Promise<any> => {
  const { regoCode } = req.body;
  if (!regoCode) return res.status(400).json({ error: 'regoCode is required' });
  const validation = await opa.validatePolicy(regoCode);
  if (!validation.valid) return res.status(400).json({ error: validation.message });
  res.json({ success: true });
});

// POST /api/v1/policies/:id/evaluate – Avaliar contra um recurso
router.post('/:id/evaluate', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });
  const { id } = req.params;
  const { resource } = req.body;

  try {
    const result = await opa.evaluatePolicy(id, resource, tenantId);
    res.json(result);
  } catch(error) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/v1/policies/stats – Estatísticas
router.get('/stats', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });
  try {
    const total = await prisma.policy.count({ where: { tenantId } });
    const enabled = await prisma.policy.count({ where: { tenantId, enabled: true } });
    const sums = await prisma.policy.aggregate({
      where: { tenantId },
      _sum: { passedCount: true, failedCount: true },
    });
    res.json({ total, enabled, totalPassed: sums._sum.passedCount || 0, totalFailed: sums._sum.failedCount || 0 });
  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
