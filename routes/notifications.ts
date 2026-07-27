import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';

const router = Router();

// GET – Obter configurações
router.get('/', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context missing' });

  try {
      const settings = await prisma.notificationSetting.findUnique({
        where: { tenantId },
      });
      res.json(settings || { enabledEvents: [] });
  } catch(e) {
      console.error(e);
      res.status(500).json({ error: 'Internal Error' });
  }
});

// PUT – Atualizar configurações
router.put('/', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context missing' });
  
  const { slackWebhook, teamsWebhook, emailRecipients, enabledEvents } = req.body;

  try {
      const settings = await prisma.notificationSetting.upsert({
        where: { tenantId },
        update: { slackWebhook, teamsWebhook, emailRecipients, enabledEvents },
        create: { tenantId, slackWebhook, teamsWebhook, emailRecipients, enabledEvents },
      });
      res.json(settings);
  } catch(e) {
      console.error(e);
      res.status(500).json({ error: 'Internal Error' });
  }
});

export default router;
