import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../services/firebaseAdmin';
import { provisionUser } from '../services/userProvisioningService';

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

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch (firebaseError) {
    console.warn('Firebase token verification failed:', firebaseError);
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }

  try {
    const user = await provisionUser({
      firebaseUid: decoded.uid,
      email: decoded.email || 'user@example.com',
      name: decoded.name,
    });

    req.user = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('Erro ao provisionar usuário:', error);
    return res.status(500).json({ error: 'Erro ao carregar contexto do usuário' });
  }
};
