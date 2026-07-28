export type DriftSource = 'terraform-refresh' | 'derived';

export interface ParsedDrift {
  resource: string;
  driftType: 'update' | 'delete' | 'create';
  provider: string | null;
  expected: unknown;
  actual: unknown;
}

/**
 * Extrai drifts do JSON de um `terraform show -json <planfile>`.
 *
 * O Terraform reporta divergências entre o estado registrado e o mundo real
 * em `resource_drift` (quando rodado com -refresh-only). Função pura e
 * testável — não toca em disco, processo ou banco.
 */
export function parseTerraformDrift(planJson: any): ParsedDrift[] {
  const drift = Array.isArray(planJson?.resource_drift) ? planJson.resource_drift : [];
  return drift.map((d: any): ParsedDrift => {
    const actions: string[] = d?.change?.actions ?? [];
    let driftType: ParsedDrift['driftType'] = 'update';
    if (actions.includes('delete')) driftType = 'delete';
    else if (actions.includes('create')) driftType = 'create';
    return {
      resource: d?.address ?? 'unknown',
      driftType,
      provider: typeof d?.provider_name === 'string'
        ? d.provider_name.split('/').pop() ?? null
        : null,
      expected: d?.change?.before ?? null,
      actual: d?.change?.after ?? null,
    };
  });
}

export function severityForDrift(driftType: ParsedDrift['driftType']): string {
  if (driftType === 'delete') return 'critical'; // recurso sumiu da cloud
  if (driftType === 'create') return 'high';      // recurso não gerenciado apareceu
  return 'medium';
}
