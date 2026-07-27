import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant context is missing.' });
    }

    const assets = await prisma.asset.findMany({
      where: {
        tenantId: tenantId
      }
    });

    if (assets.length === 0) {
      // Mock some initial data if the database is empty just for demo purposes
      return res.json([
        { id: 'as-1', name: 'prod-api-server', type: 'aws_instance', category: 'compute', provider: 'AWS', region: 'us-east-1', status: 'running', riskScore: 12, cost: 45.5, tags: { env: 'prod' } },
        { id: 'as-2', name: 'customer-data', type: 'aws_s3_bucket', category: 'storage', provider: 'AWS', region: 'us-east-1', status: 'running', riskScore: 85, cost: 120.0, tags: { env: 'prod', data: 'sensitive' } }
      ]);
    }

    res.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant context is missing.' });
    }

    const { name, type, category, provider, region, cost, riskScore } = req.body;

    const newAsset = await prisma.asset.create({
      data: {
        name,
        type,
        category,
        provider,
        region,
        cost: cost || 0,
        riskScore: riskScore || 0,
        tenantId
      }
    });

    res.status(201).json(newAsset);
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

export default router;
