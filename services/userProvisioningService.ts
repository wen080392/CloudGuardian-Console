import { Prisma } from '@prisma/client';
import { prisma } from './db';
import { instantAuditService } from './instantAuditService';

export interface ProvisionInput {
  firebaseUid: string;
  email: string;
  name?: string | null;
  companyName?: string | null;
}

/**
 * Localiza ou cria (usuário + tenant) a partir de um token Firebase verificado.
 *
 * Seguro contra corrida: tenant+usuário nascem numa única operação atômica
 * (nested create) e violações de unicidade (P2002) de requisições concorrentes
 * caem num re-fetch em vez de duplicar tenants ou estourar 500.
 */
export async function provisionUser(input: ProvisionInput) {
  const { firebaseUid, email, name, companyName } = input;

  const byUid = await prisma.user.findUnique({
    where: { firebaseUid },
    include: { tenant: true },
  });
  if (byUid) return byUid;

  try {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      // Usuário pré-existente (ex.: convidado por admin) — vincula o UID
      const linked = await prisma.user.update({
        where: { email },
        data: { firebaseUid },
        include: { tenant: true },
      });
      await convertLeadsBestEffort(email, linked.tenantId);
      return linked;
    }

    await prisma.tenant.create({
      data: {
        name: companyName || `${email.split('@')[0]}'s Company`,
        users: {
          create: {
            firebaseUid,
            email,
            name: name || 'Usuário',
            role: 'admin',
          },
        },
      },
    });
  } catch (e) {
    const isUniqueViolation =
      e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
    if (!isUniqueViolation) throw e;
    // Outra requisição concorrente venceu a corrida — o re-fetch abaixo resolve
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenant: true },
  });
  if (!user) {
    throw new Error(`Falha ao provisionar usuário para ${email}`);
  }

  await convertLeadsBestEffort(email, user.tenantId);

  return user;
}

/**
 * Conversão do funil PLG: se este email rodou a auditoria de 5 minutos como
 * lead, atribui a conversão ao tenant provisionado. Best-effort — um erro
 * aqui jamais pode impedir o login/registro.
 */
async function convertLeadsBestEffort(email: string, tenantId: string | null) {
  if (!tenantId) return;
  try {
    await instantAuditService.markLeadConverted(email, tenantId);
  } catch (e) {
    console.error(`Falha ao marcar conversão de lead para ${email}:`, e);
  }
}
