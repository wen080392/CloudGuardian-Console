import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../services/firebaseAdmin';
import { prisma } from '../services/db';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        tenantId: string | null;
        email: string;
        role: string;
      };
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    let decodedUid = '';
    
    // 1. Verificar token do Firebase
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      decodedUid = decoded.uid;
    } catch (firebaseError) {
      console.warn("Firebase token verification failed:", firebaseError);
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    // 2. Buscar usuário no banco de dados (PostgreSQL) pelo UID
    let user = await prisma.user.findUnique({
      where: { firebaseUid: decodedUid },
      include: { tenant: true }
    });

    // 3. Se não existir, auto-criar
    if (!user) {
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        const email = decoded.email || 'user@example.com';
        const name = decoded.name || 'Auto-created User';
        
        let existingUserByEmail = await prisma.user.findUnique({
          where: { email: email }
        });
        if (existingUserByEmail) {
          user = await prisma.user.update({
            where: { email: email },
            data: { firebaseUid: decodedUid },
            include: { tenant: true }
          });
        } else {
          const tenant = await prisma.tenant.create({
            data: {
              name: `${email.split('@')[0]}'s Company`,
              users: {
                create: {
                  firebaseUid: decodedUid,
                  email: email,
                  name: name,
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
        
        if (!user) {
           return res.status(404).json({ error: 'Usuário não encontrado no banco de dados' });
        }
      } catch (e) {
         console.error('Failed to auto-create user', e);
         return res.status(404).json({ error: 'Usuário não encontrado no banco de dados e falha ao auto-criar' });
      }
    }

    // 4. Anexar os dados do usuário e tenant na requisição
    req.user = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('Erro de autenticação:', error);
    return res.status(401).json({ error: 'Erro de autenticação' });
  }
};
