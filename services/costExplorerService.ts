import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  GetCostForecastCommand,
  type GroupDefinition,
} from '@aws-sdk/client-cost-explorer';

export type CostSource = 'aws-cost-explorer' | 'estimate';

export interface ServiceCost {
  service: string;
  cost: number;
}

export interface RealCostResult {
  source: CostSource;
  currency: string;
  totalCost: number;
  projectedCost: number;
  periodStart: string;
  periodEnd: string;
  byService: ServiceCost[];
}

function firstOfThisMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Busca custos reais da conta AWS via Cost Explorer.
 *
 * Requer AWS_REGION + credenciais. Retorna `source: 'aws-cost-explorer'`
 * quando os dados são reais; se as credenciais não estiverem configuradas,
 * `isConfigured()` é false e o chamador deve rotular os dados como estimativa.
 */
export class CostExplorerService {
  private client: CostExplorerClient | null = null;

  constructor() {
    if (process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.client = new CostExplorerClient({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async getMonthToDateCost(): Promise<RealCostResult> {
    if (!this.client) {
      throw new Error('AWS Cost Explorer não configurado (AWS_REGION + credenciais).');
    }

    const start = firstOfThisMonth();
    const end = new Date();
    const groupBy: GroupDefinition[] = [{ Type: 'DIMENSION', Key: 'SERVICE' }];

    const usage = await this.client.send(new GetCostAndUsageCommand({
      TimePeriod: { Start: ymd(start), End: ymd(end) },
      Granularity: 'MONTHLY',
      Metrics: ['UnblendedCost'],
      GroupBy: groupBy,
    }));

    const groups = usage.ResultsByTime?.[0]?.Groups ?? [];
    let currency = 'USD';
    const byService: ServiceCost[] = groups.map(g => {
      const metric = g.Metrics?.UnblendedCost;
      if (metric?.Unit) currency = metric.Unit;
      return {
        service: g.Keys?.[0] ?? 'unknown',
        cost: Number(metric?.Amount ?? 0),
      };
    }).filter(s => s.cost > 0).sort((a, b) => b.cost - a.cost);

    const totalCost = byService.reduce((sum, s) => sum + s.cost, 0);

    // Projeção para o fim do mês via forecast da própria AWS
    let projectedCost = totalCost;
    try {
      const monthEnd = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
      const forecast = await this.client.send(new GetCostForecastCommand({
        TimePeriod: { Start: ymd(end), End: ymd(monthEnd) },
        Granularity: 'MONTHLY',
        Metric: 'UNBLENDED_COST',
      }));
      projectedCost = totalCost + Number(forecast.Total?.Amount ?? 0);
    } catch {
      // Forecast pode falhar (histórico insuficiente) — mantém o total como projeção
    }

    return {
      source: 'aws-cost-explorer',
      currency,
      totalCost,
      projectedCost,
      periodStart: ymd(start),
      periodEnd: ymd(end),
      byService,
    };
  }
}

export const costExplorerService = new CostExplorerService();
