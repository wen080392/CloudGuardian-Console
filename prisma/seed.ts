import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não configurada — necessário para o seed.');
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  await prisma.auditLog.deleteMany();
  await prisma.policyEvaluation.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.vulnerability.deleteMany();
  await prisma.scan.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  console.log('🧹 Dados antigos removidos.');

  const tenant = await prisma.tenant.create({
    data: {
      name: 'Demonstração CloudGuardian',
      plan: 'business',
      users: {
        create: {
          email: 'admin@cloudguardian.demo',
          name: 'Admin Demo',
          firebaseUid: 'demo-firebase-uid-123',
          role: 'admin',
        },
      },
    },
    include: { users: true },
  });
  const user = tenant.users[0];
  console.log(`🏢 Tenant criado: ${tenant.name} — 👤 ${user.email}`);

  const project = await prisma.project.create({
    data: {
      name: 'Infraestrutura de Demonstração',
      cloud: 'AWS',
      region: 'us-east-1',
      score: 82,
      tenantId: tenant.id,
      userId: user.id,
    },
  });

  await prisma.scan.create({
    data: {
      projectId: project.id,
      vulnsCount: 2,
      status: 'completed',
      startedAt: new Date(Date.now() - 60_000),
      finishedAt: new Date(),
    },
  });

  await prisma.vulnerability.createMany({
    data: [
      {
        tenantId: tenant.id,
        resourceId: 'aws_s3_bucket.assets',
        ruleId: 'CKV_AWS_20',
        title: 'Bucket S3 com ACL pública',
        severity: 'critical',
        status: 'open',
      },
      {
        tenantId: tenant.id,
        resourceId: 'aws_security_group.web',
        ruleId: 'CKV_AWS_24',
        title: 'Porta 22 aberta para 0.0.0.0/0',
        severity: 'high',
        status: 'open',
      },
    ],
  });

  await prisma.policy.create({
    data: {
      name: 'S3 Public Block',
      description: 'Impedir buckets públicos.',
      type: 'security',
      framework: 'CIS',
      severity: 'critical',
      regoCode: 'package cloudguardian\n\ndeny[msg] { input.acl == "public-read"; msg := "Bucket público" }',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Seed concluído.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
