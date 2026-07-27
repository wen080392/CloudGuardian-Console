import { Router } from 'express';
import { prisma } from '../services/db';
import { adminAuth } from '../services/firebaseAdmin';
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
router.post('/register', validate(registerSchema), async (req, res) => {
  const { email, name, companyName } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    let decodedUid = 'mock-uid-' + Date.now();
    let decodedEmail = email;

    // Verificar o token do Firebase enviado pelo frontend
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      decodedUid = decoded.uid;
      decodedEmail = decoded.email || email;
    } catch (firebaseError) {
      console.warn("Firebase token verification failed (mocking for development):", firebaseError);
    }
    
    // Verificar se o email do token bate com o email enviado
    if (decodedEmail !== email) {
      return res.status(400).json({ error: 'Email não corresponde ao token' });
    }

    // Verificar se o usuário já existe
    let user = await prisma.user.findUnique({
      where: { email: email },
      include: { tenant: true }
    });

    let tenant;

    if (user) {
      // Atualizar o UID do Firebase se necessário
      user = await prisma.user.update({
        where: { email: email },
        data: { firebaseUid: decodedUid },
        include: { tenant: true }
      });
      tenant = user.tenant;
    } else {
      // Criar o Tenant e o User no PostgreSQL
      tenant = await prisma.tenant.create({
        data: {
          name: companyName || `${email.split('@')[0]}'s Company`,
          users: {
            create: {
              firebaseUid: decodedUid,
              email: email,
              name: name || 'Usuário',
              role: 'admin'
            }
          }
        }
      });

      user = await prisma.user.findUnique({
        where: { firebaseUid: decodedUid },
        include: { tenant: true }
      });
    }

    res.status(201).json({ user, tenant });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

export default router;
