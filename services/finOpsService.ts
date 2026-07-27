import { prisma } from './db';

// Preços de referência (exemplo – em produção use a API de pricing da AWS)
const pricing: Record<string, any> = {
  ec2: {
    't2.micro': 0.0116,
    't2.small': 0.023,
    't2.medium': 0.0464,
    't2.large': 0.0928,
    't3.micro': 0.0104,
    't3.small': 0.0208,
    't3.medium': 0.0416,
    't3.large': 0.0832,
    'm5.large': 0.096,
    'm5.xlarge': 0.192,
    'c5.large': 0.085,
    'c5.xlarge': 0.17,
    'r5.large': 0.126,
    'r5.xlarge': 0.252,
  },
  s3: {
    standard: 0.023,      // por GB/mês
    standard_ia: 0.0125,
    glacier: 0.004,
    deep_archive: 0.00099,
  },
  ebs: {
    gp2: 0.10,
    gp3: 0.08,
    io1: 0.125,
    st1: 0.045,
    sc1: 0.025,
  },
  rds: {
    'db.t3.micro': 0.017,
    'db.t3.small': 0.034,
    'db.t3.medium': 0.068,
    'db.m5.large': 0.23,
  },
  // ... outros serviços
};

export class FinOpsService {
  // Analisar custos de um recurso individual
  async analyzeResource(resource: any) {
    const cost = {
      resourceId: resource.id,
      resourceType: resource.type,
      name: resource.name,
      hourly: 0,
      daily: 0,
      monthly: 0,
      yearly: 0,
      efficiency: 100,
      recommendations: [] as any[],
    };

    switch (resource.type) {
      case 'aws_instance': {
        // Map to ec2
        const instanceType = resource.tags?.instanceType || 't2.micro';
        const price = pricing.ec2[instanceType];
        if (price) {
          cost.hourly = price;
          cost.daily = price * 24;
          cost.monthly = price * 24 * 30;
          cost.yearly = cost.monthly * 12;
        } else {
            cost.monthly = resource.cost || 0;
            cost.daily = cost.monthly / 30;
            cost.hourly = cost.daily / 24;
            cost.yearly = cost.monthly * 12;
        }
        // Simular utilização (em produção, viria do CloudWatch)
        const cpuUtilization = resource.tags?.cpuUtilization ?? 50;
        if (cpuUtilization < 10) {
          cost.efficiency = 20;
          cost.recommendations.push({
            type: 'rightsizing',
            title: 'Instância subutilizada',
            description: `CPU utilização em ${cpuUtilization}%. Recomenda-se reduzir tamanho.`,
            savings: cost.monthly * 0.6,
            action: `Redimensionar de ${instanceType} para menor`,
          });
        } else if (cpuUtilization < 30) {
          cost.efficiency = 50;
          cost.recommendations.push({
            type: 'rightsizing',
            title: 'Instância com baixa utilização',
            description: `CPU utilização em ${cpuUtilization}%. Considere reduzir tamanho.`,
            savings: cost.monthly * 0.3,
            action: `Avaliar redimensionamento`,
          });
        }
        break;
      }
      case 'aws_s3_bucket': {
        const storageClass = resource.tags?.storageClass || 'standard';
        const price = pricing.s3[storageClass] || 0.023;
        const sizeGB = (resource.tags?.size || 0) / 1024 / 1024 / 1024; // bytes to GB
        cost.monthly = sizeGB * price || resource.cost || 0;
        cost.daily = cost.monthly / 30;
        cost.hourly = cost.daily / 24;
        cost.yearly = cost.monthly * 12;
        // Recomendação se > 90 dias sem acesso
        if (resource.tags?.lastAccessDays && resource.tags.lastAccessDays > 90) {
          cost.recommendations.push({
            type: 'optimization',
            title: 'Arquivar dados antigos',
            description: `Objetos com +90 dias sem acesso podem ir para Glacier (economia ~80%).`,
            savings: cost.monthly * 0.8,
            action: 'Configurar lifecycle policy',
          });
        }
        break;
      }
      // ... adicionar outros serviços
      default: {
        cost.monthly = resource.cost || 0;
        cost.daily = cost.monthly / 30;
        cost.hourly = cost.daily / 24;
        cost.yearly = cost.monthly * 12;
      }
    }

    return cost;
  }

  // Analisar todos os recursos de um tenant
  async analyzeTenant(tenantId: string) {
    // Buscar todos os recursos do tenant
    const resources = await prisma.asset.findMany({
      where: { tenantId },
    });

    const analysis: any = {
      tenantId,
      totalCost: 0,
      projectedCost: 0,
      savings: 0,
      resources: [],
      services: {},
      tags: {},
      recommendations: [],
    };

    for (const resource of resources) {
      const cost = await this.analyzeResource(resource);
      analysis.resources.push(cost);
      analysis.totalCost += cost.monthly;

      // Agrupar por serviço
      const service = resource.type;
      if (!analysis.services[service]) {
        analysis.services[service] = { count: 0, cost: 0, savings: 0 };
      }
      analysis.services[service].count++;
      analysis.services[service].cost += cost.monthly;

      // Acumular savings
      for (const rec of cost.recommendations) {
        analysis.savings += rec.savings;
        analysis.recommendations.push({
          ...rec,
          resourceId: resource.id,
          resourceName: resource.name,
        });
      }

      // Tags
      const tags = (resource.tags as Record<string, string>) || {};
      for (const [key, value] of Object.entries(tags)) {
        const tagKey = `${key}:${value}`;
        if (!analysis.tags[tagKey]) {
          analysis.tags[tagKey] = { cost: 0, resources: [] };
        }
        analysis.tags[tagKey].cost += cost.monthly;
        analysis.tags[tagKey].resources.push(resource.id);
      }
    }

    analysis.projectedCost = analysis.totalCost * 12;
    analysis.efficiency = analysis.resources.length > 0 ? analysis.resources.reduce((sum: number, r: any) => sum + r.efficiency, 0) / analysis.resources.length : 100;

    // Ordenar recomendações por savings
    analysis.recommendations.sort((a: any, b: any) => b.savings - a.savings);

    // Salvar no banco
    const costAnalysis = await prisma.costAnalysis.create({
      data: {
        tenantId,
        period: 'monthly',
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date(),
        totalCost: analysis.totalCost,
        projectedCost: analysis.projectedCost,
        savings: analysis.savings,
        efficiency: analysis.efficiency,
        resources: analysis.resources,
        services: analysis.services,
        tags: analysis.tags,
        recommendations: analysis.recommendations,
      },
    });

    // Verificar alertas de orçamento
    await this.checkBudgetAlerts(tenantId, analysis.totalCost);

    return {
      id: costAnalysis.id,
      ...analysis,
    };
  }

  // Verificar alertas de orçamento
  async checkBudgetAlerts(tenantId: string, currentSpend: number) {
    const alerts = await prisma.budgetAlert.findMany({
      where: { tenantId, enabled: true },
    });

    for (const alert of alerts) {
      let shouldTrigger = false;
      if (alert.comparison === 'above' && currentSpend > alert.threshold) {
        shouldTrigger = true;
      } else if (alert.comparison === 'below' && currentSpend < alert.threshold) {
        shouldTrigger = true;
      }

      if (shouldTrigger && !alert.triggered) {
        await prisma.budgetAlert.update({
          where: { id: alert.id },
          data: {
            triggered: true,
            triggeredAt: new Date(),
            currentSpend,
          },
        });
        // Enviar notificação (aqui você pode integrar com email/Slack)
        console.log(`🔔 Alerta ${alert.name} disparado! Gasto: ${currentSpend}`);
      } else if (!shouldTrigger && alert.triggered) {
        await prisma.budgetAlert.update({
          where: { id: alert.id },
          data: { triggered: false, triggeredAt: null },
        });
      }

      await prisma.budgetAlert.update({
        where: { id: alert.id },
        data: { lastChecked: new Date() },
      });
    }
  }
}
