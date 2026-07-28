import { Router } from 'express';
import { adminAuth } from '../services/firebaseAdmin';
import { provisionUser } from '../services/userProvisioningService';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    name: z.string().min(2, 'Nome muito curto').optional(),
    companyName: z.string().min(2, 'Nome da empresa muito curto').optional()
  })
});

const router = Router();

// Rota de Registro (Cria o Tenant e o User no banco após o Firebase criar o usuário)
router.post('/register', validate(registerSchema), async (req, res): Promise<any> => {
  const { email, name, companyName } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch (firebaseError) {
    console.warn('Firebase token verification failed:', firebaseError);
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }

  // O email do corpo precisa corresponder ao dono do token
  if (decoded.email && decoded.email !== email) {
    return res.status(400).json({ error: 'Email não corresponde ao token' });
  }

  try {
    const user = await provisionUser({
      firebaseUid: decoded.uid,
      email,
      name,
      companyName,
    });

    res.status(201).json({ user, tenant: user.tenant });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

export default router;
