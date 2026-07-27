import { audit } from '../services/auditService';
import { Request, Response, NextFunction } from 'express';

export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.on('finish', async () => {
    if (req.user) {
      const { tenantId, userId } = req.user;
      
      // Filter out GET requests to avoid spamming the log if needed, or keep it.
      // But let's only log mutations (POST, PUT, PATCH, DELETE) for this standard approach.
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        await audit.log(
            tenantId || 'unknown',
            `api.access.${req.method.toLowerCase()}`,
            userId,
            null,
            null,
            { path: req.path, method: req.method, status: res.statusCode },
            req
        );
      }
    }
  });
  next();
};
