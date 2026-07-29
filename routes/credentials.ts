import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../services/db';
import { encryptionService } from '../services/encryptionService';
import { audit } from '../services/auditService';
import { validate } from '../middleware/validate';

const saveCredentialSchema = z.object({
  body: z.object({
    provider: z.enum(['aws', 'gcp', 'azure', 'github']),
    roleArn: z.string().max(2048).optional().nullable(),
    accessKey: z.string().min(1).max(4096).optional().nullable(),
    secretKey: z.string().min(1).max(4096).optional().nullable(),
    region: z.string().max(64).optional().nullable(),
  }),
});

const router = Router();

router.post('/', validate(saveCredentialSchema), async (req, res): Promise<any> => {
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;
  if (!tenantId) return res.status(403).json({ error: 'Contexto de tenant necessário' });

  const { provider, roleArn, accessKey, secretKey, region } = req.body;

  try {
    const encryptedAccessKey = accessKey ? await encryptionService.encrypt(accessKey) : null;
    const encryptedSecretKey = secretKey ? await encryptionService.encrypt(secretKey) : null;

    const credential = await prisma.cloudCredential.upsert({
      where: {
        tenantId_provider: { tenantId, provider },
      },
      update: {
        roleArn,
        accessKey: encryptedAccessKey,
        secretKey: encryptedSecretKey,
        region,
      },
      create: {
        tenantId,
        provider,
        roleArn,
        accessKey: encryptedAccessKey,
        secretKey: encryptedSecretKey,
        region,
      },
    });

    await audit.log(tenantId, `credentials.${provider}.save`, userId || 'system', credential.id, 'CloudCredential', { region }, req);

    res.json({ success: true, id: credential.id });
  } catch (error) {
    console.error('Erro ao salvar credenciais:', error);
    res.status(500).json({ error: 'Erro ao salvar credenciais' });
  }
});

router.get('/', async (req, res): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Contexto de tenant necessário' });
  try {
    const credentials = await prisma.cloudCredential.findMany({
      where: { tenantId },
      select: {
        id: true,
        provider: true,
        roleArn: true,
        region: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(credentials);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res): Promise<any> => {
  const tenantId = req.user?.tenantId;
  const userId = req.user?.userId;
  if (!tenantId) return res.status(403).json({ error: 'Contexto de tenant necessário' });
  const { id } = req.params;

  try {
    await prisma.cloudCredential.deleteMany({
      where: { id, tenantId },
    });
    await audit.log(tenantId, 'credentials.delete', userId || 'system', id, 'CloudCredential', {}, req);
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
