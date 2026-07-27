import { prisma } from './db';

export class AuditService {
  async log(
    tenantId: string,
    action: string,
    userId: string | null = null,
    resourceId: string | null = null,
    resourceType: string | null = null,
    details: any = null,
    req: any = null
  ) {
    try {
      const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || null;
      const userAgent = req?.headers?.['user-agent'] || null;

      await prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action,
          resourceId,
          resourceType,
          details,
          ipAddress: typeof ipAddress === 'string' ? ipAddress : null,
          userAgent,
        },
      });
    } catch (error) {
      console.error('Falha ao registrar audit log:', error);
    }
  }
}

export const audit = new AuditService();
