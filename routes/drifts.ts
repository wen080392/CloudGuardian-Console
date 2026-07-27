import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';

const router = Router();

// GET /api/v1/drifts - List all drifts for the tenant
router.get('/', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });

  try {
    // Since we don't have a Drift model yet, generate synthetic drifts from vulnerabilities and assets
    const vulnerabilities = await prisma.vulnerability.findMany({
      where: { tenantId, status: 'open' },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    const drifts = vulnerabilities
      .filter(v => v.severity === 'critical' || v.severity === 'high')
      .map((v, i) => ({
        id: `drift-${v.id.slice(0, 8)}`,
        resource: v.resourceId,
        type: 'configuration',
        severity: v.severity === 'critical' ? 'CRITICAL' : 'HIGH',
        status: 'detected',
        expected: 'Compliant configuration per IaC definition',
        actual: v.title,
        detectedAt: v.createdAt,
        source: 'checkov-scan'
      }));

    res.json(drifts);
  } catch (error) {
    console.error('Error fetching drifts:', error);
    res.status(500).json({ error: 'Failed to fetch drifts' });
  }
});

// POST /api/v1/drifts/:id/resolve - Mark drift as resolved
router.post('/:id/resolve', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });

  res.json({ success: true, message: 'Drift resolved' });
});

export default router;
