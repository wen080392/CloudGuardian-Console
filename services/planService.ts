import { prisma } from './db';

/**
 * Limites por tier de assinatura (ver docs/BUSINESS_PLAN_AND_ROADMAP.md).
 * `Infinity` = ilimitado.
 */
export const PLAN_LIMITS: Record<string, { maxProjects: number }> = {
  starter: { maxProjects: 3 },
  growth: { maxProjects: 20 },
  business: { maxProjects: 100 },
  enterprise: { maxProjects: Infinity },
};

const limitsFor = (plan: string | null | undefined) =>
  PLAN_LIMITS[plan ?? 'starter'] ?? PLAN_LIMITS.starter;

export async function canCreateProject(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const { maxProjects } = limitsFor(tenant?.plan);
  if (maxProjects === Infinity) return { allowed: true };

  const count = await prisma.project.count({ where: { tenantId } });
  if (count >= maxProjects) {
    return {
      allowed: false,
      reason: `Limite de ${maxProjects} projetos do plano ${tenant?.plan ?? 'starter'} atingido. Faça upgrade para criar mais projetos.`,
    };
  }
  return { allowed: true };
}
