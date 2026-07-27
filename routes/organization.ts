import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';

const router = Router();

// GET /api/v1/organization/members - List all members in the tenant
router.get('/members', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });

  try {
    const users = await prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const members = users.map(u => ({
      id: u.id,
      name: u.name || u.email.split('@')[0],
      email: u.email,
      role: u.role,
      lastActive: u.updatedAt.toISOString()
    }));

    res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// POST /api/v1/organization/members - Invite a new member
router.post('/members', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });

  const { email, name, role } = req.body;

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        role: role || 'viewer',
        tenantId
      }
    });
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastActive: user.createdAt.toISOString()
    });
  } catch (error) {
    console.error('Error inviting member:', error);
    res.status(500).json({ error: 'Failed to invite member' });
  }
});

// GET /api/v1/organization/info - Get tenant info
router.get('/info', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { _count: { select: { users: true, projects: true, policies: true } } }
    });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    res.json({
      id: tenant.id,
      name: tenant.name,
      createdAt: tenant.createdAt,
      counts: tenant._count
    });
  } catch (error) {
    console.error('Error fetching org info:', error);
    res.status(500).json({ error: 'Failed to fetch organization info' });
  }
});

export default router;
