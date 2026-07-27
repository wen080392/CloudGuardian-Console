import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';

const router = Router();

// GET /api/v1/timeline - Get recent events for the tenant
router.get('/', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });

  try {
    const auditLogs = await prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Transform audit logs into timeline events format the frontend expects
    const events = auditLogs.map(log => ({
      id: log.id,
      type: log.action.includes('scan') ? 'SCAN' : 
            log.action.includes('policy') ? 'POLICY' : 
            log.action.includes('credential') ? 'CONFIG' :
            log.action.includes('report') ? 'REPORT' : 'SYSTEM',
      title: log.action.replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      description: (log.details as any)?.description || `Action: ${log.action}`,
      severity: (log.details as any)?.severity || 'LOW',
      timestamp: log.createdAt.toISOString(),
      metadata: log.details
    }));

    res.json(events);
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

// POST /api/v1/timeline - Log a new event
router.post('/', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });

  const { type, title, description, severity } = req.body;

  try {
    const log = await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: `${type?.toLowerCase() || 'system'}.event`,
        details: { title, description, severity, type }
      }
    });

    res.status(201).json({
      id: log.id,
      type: type || 'SYSTEM',
      title,
      description,
      severity: severity || 'LOW',
      timestamp: log.createdAt.toISOString(),
      metadata: log.details
    });
  } catch (error) {
    console.error('Error logging event:', error);
    res.status(500).json({ error: 'Failed to log event' });
  }
});

export default router;
