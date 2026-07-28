// @vitest-environment node
import { describe, it, expect, afterEach, vi } from 'vitest';
import { CostExplorerService } from '../services/costExplorerService';

describe('CostExplorerService', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('não está configurado sem credenciais AWS', () => {
    vi.stubEnv('AWS_REGION', '');
    vi.stubEnv('AWS_ACCESS_KEY_ID', '');
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', '');
    expect(new CostExplorerService().isConfigured()).toBe(false);
  });

  it('lança ao buscar custo sem configuração (nunca inventa número)', async () => {
    vi.stubEnv('AWS_REGION', '');
    vi.stubEnv('AWS_ACCESS_KEY_ID', '');
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', '');
    await expect(new CostExplorerService().getMonthToDateCost())
      .rejects.toThrow(/não configurado/);
  });

  it('fica configurado quando há região e credenciais', () => {
    vi.stubEnv('AWS_REGION', 'us-east-1');
    vi.stubEnv('AWS_ACCESS_KEY_ID', 'AKIAEXAMPLE');
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', 'secret');
    expect(new CostExplorerService().isConfigured()).toBe(true);
  });

  it('parseia e ordena o custo por serviço a partir da resposta da AWS', async () => {
    vi.stubEnv('AWS_REGION', 'us-east-1');
    vi.stubEnv('AWS_ACCESS_KEY_ID', 'AKIAEXAMPLE');
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', 'secret');
    const svc = new CostExplorerService();
    // Injeta um cliente falso que devolve o shape real do Cost Explorer
    (svc as any).client = {
      send: vi.fn()
        .mockResolvedValueOnce({
          ResultsByTime: [{
            Groups: [
              { Keys: ['Amazon EC2'], Metrics: { UnblendedCost: { Amount: '120.50', Unit: 'USD' } } },
              { Keys: ['Amazon S3'], Metrics: { UnblendedCost: { Amount: '10.00', Unit: 'USD' } } },
              { Keys: ['Zero'], Metrics: { UnblendedCost: { Amount: '0', Unit: 'USD' } } },
            ],
          }],
        })
        .mockResolvedValueOnce({ Total: { Amount: '50.00' } }),
    };

    const result = await svc.getMonthToDateCost();
    expect(result.source).toBe('aws-cost-explorer');
    expect(result.currency).toBe('USD');
    expect(result.totalCost).toBeCloseTo(130.5);
    expect(result.projectedCost).toBeCloseTo(180.5); // total + forecast
    expect(result.byService.map(s => s.service)).toEqual(['Amazon EC2', 'Amazon S3']); // ordenado desc, zero removido
  });
});
