import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres').max(100),
    cloud: z.enum(['AWS', 'GCP', 'Azure'], { errorMap: () => ({ message: 'Provedor de nuvem inválido' }) }),
    region: z.string().min(2).optional(),
    repoUrl: z.string().url().optional().or(z.literal(''))
  })
});

const router = Router();

// GET /api/v1/projects - List all projects for the user's tenant
router.get('/', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });

  try {
    let projects = await prisma.project.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { scans: { take: 1, orderBy: { createdAt: 'desc' } } }
    });

    // If no projects exist, create default ones for the user
    if (projects.length === 0) {
      await prisma.project.createMany({
        data: [
          { name: 'Infrastructure-Prod', cloud: 'AWS', region: 'us-east-1', status: 'active', score: 85, userId, tenantId },
          { name: 'Legacy-Backend', cloud: 'Azure', region: 'eastus', status: 'active', score: 42, userId, tenantId }
        ]
      });
      projects = await prisma.project.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        include: { scans: { take: 1, orderBy: { createdAt: 'desc' } } }
      });
    }

    // Map to frontend format
    const mapped = projects.map(p => ({
      id: p.id,
      name: p.name,
      cloud: p.cloud,
      region: p.region,
      status: p.status,
      score: p.score,
      lastScan: p.scans[0]?.createdAt?.toISOString() || p.createdAt.toISOString(),
      repoUrl: p.repoUrl
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /api/v1/projects - Create a new project
router.post('/', validate(createProjectSchema), async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });

  const { name, cloud, region, repoUrl } = req.body;

  try {
    const project = await prisma.project.create({
      data: { name, cloud, region: region || 'us-east-1', userId, tenantId, repoUrl }
    });
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PATCH /api/v1/projects/:id - Update a project
router.patch('/:id', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });
  const { id } = req.params;
  const { name, cloud, region, status, repoUrl } = req.body;

  try {
    const project = await prisma.project.updateMany({
      where: { id, tenantId },
      data: { ...(name && { name }), ...(cloud && { cloud }), ...(region && { region }), ...(status && { status }), ...(repoUrl && { repoUrl }) }
    });
    if (project.count === 0) return res.status(404).json({ error: 'Project not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

export default router;
