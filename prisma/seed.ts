import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // 1. Limpar dados existentes (para não duplicar)
  await prisma.auditLog.deleteMany();
  await prisma.policyEvaluation.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.vulnerability.deleteMany();
  await prisma.driftDetection.deleteMany();
  await prisma.scan.deleteMany();
  await prisma.cloudResource.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  console.log('🧹 Dados antigos removidos.');

  // 2. Criar Tenant de Demonstração
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Demonstração CloudGuardian',
      plan: 'pro',
      maxRepos: 10,
      maxScansPerMonth: 999999,
      retentionDays: 90,
      features: ['auto_fix', 'finops', 'reports', 'drift'],
      subscriptionStatus: 'active',
    },
  });
  console.log(`🏢 Tenant criado: ${tenant.name}`);

  // 3. Criar Usuário Admin
  const user = await prisma.user.create({
    data: {
      email: 'admin@cloudguardian.demo',
      name: 'Admin Demo',
      firebaseUid: 'demo-firebase-uid-123', // Simulado para testes
      role: 'admin',
      tenantId: tenant.id,
    },
  });
  console.log(`👤 Usuário criado: ${user.email} (Senha: Admin123!)`);

  // 4. Criar Projeto
  const project = await prisma.project.create({
    data: {
      name: 'Infraestrutura de Demonstração',
      repoUrl: 'https://github.com/cloudguardian/demo-infra',
      tenantId: tenant.id,
    },
  });
  console.log(`📁 Projeto criado: ${project.name}`);

  // 5. Criar Recursos (Ativos) para o FinOps e Topologia
  const vpc = await prisma.cloudResource.create({
    data: {
      resourceId: 'vpc-demo-01',
      resourceType: 'vpc',
      name: 'VPC Principal',
      region: 'us-east-1',
      state: 'available',
      tags: { Environment: 'Production', Owner: 'DevOps' },
      tenantId: tenant.id,
    },
  });

  const subnet = await prisma.cloudResource.create({
    data: {
      resourceId: 'subnet-demo-01',
      resourceType: 'subnet',
      name: 'Subnet Pública',
      region: 'us-east-1',
      state: 'available',
      tags: { Environment: 'Production' },
      parentId: vpc.id, // Hierarquia para o grafo
      tenantId: tenant.id,
    },
  });

  const ec2 = await prisma.cloudResource.create({
    data: {
      resourceId: 'i-demo-ec2-01',
      resourceType: 'ec2',
      name: 'Web Server',
      region: 'us-east-1',
      state: 'running',
      tags: { Environment: 'Production', Name: 'Web Server' },
      parentId: subnet.id,
      tenantId: tenant.id,
    },
  });

  const s3 = await prisma.cloudResource.create({
    data: {
      resourceId: 'demo-data-lake',
      resourceType: 's3',
      name: 'Data Lake',
      region: 'us-east-1',
      state: 'active',
      tags: { Environment: 'Production' },
      tenantId: tenant.id,
    },
  });
  console.log(`☁️ Recursos criados: VPC, Subnet, EC2, S3`);

  // 6. Criar Política de Exemplo (OPA)
  const policy = await prisma.policy.create({
    data: {
      name: 'S3 Não Público (CIS)',
      description: 'Garante que buckets S3 não sejam públicos.',
      type: 'security',
      framework: 'CIS',
      severity: 'high',
      regoCode: `package cis\ndeny[msg] {\n  resource := input.resource\n  resource.type == "s3"\n  resource.public == true\n  msg := sprintf("S3 bucket %v está público", [resource.name])\n}`,
      enabled: true,
      tenantId: tenant.id,
    },
  });
  console.log(`📜 Política OPA criada: ${policy.name}`);

  // 7. Criar Vulnerabilidades (simulando um scan)
  const vuln = await prisma.vulnerability.create({
    data: {
      resourceId: s3.id,
      ruleId: 'CKV_AWS_18',
      title: 'Bucket S3 Público',
      description: 'O bucket Data Lake está público para toda a internet.',
      severity: 'critical',
      status: 'open',
      filePath: 's3.tf',
      line: 5,
      details: { check_id: 'CKV_AWS_18' },
      tenantId: tenant.id,
    },
  });
  console.log(`🚨 Vulnerabilidade de exemplo criada: ${vuln.title}`);

  // 8. Criar um Drift Detection (simulado)
  const drift = await prisma.driftDetection.create({
    data: {
      projectId: project.id,
      expected: { resources: ['vpc-demo-01'] },
      actual: { resources: ['vpc-demo-01', 'sg-extra'] },
      differences: [
        { type: 'added', resource: 'sg-extra', severity: 'high' },
      ],
      driftCount: 1,
      severity: 'high',
      status: 'detected',
      tenantId: tenant.id,
    },
  });
  console.log(`📊 Drift Detection de exemplo criado: ${drift.id}`);

  console.log('✅ Seed concluído com sucesso!');
  console.log('🔐 Acesse com: admin@cloudguardian.demo / Admin123!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
