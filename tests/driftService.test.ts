// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { parseTerraformDrift } from '../services/driftParser';

describe('parseTerraformDrift', () => {
  it('extrai drift de update com provider e before/after', () => {
    const plan = {
      resource_drift: [
        {
          address: 'aws_s3_bucket.assets',
          provider_name: 'registry.terraform.io/hashicorp/aws',
          change: {
            actions: ['update'],
            before: { acl: 'private' },
            after: { acl: 'public-read' },
          },
        },
      ],
    };
    const [d] = parseTerraformDrift(plan);
    expect(d.resource).toBe('aws_s3_bucket.assets');
    expect(d.driftType).toBe('update');
    expect(d.provider).toBe('aws');
    expect(d.expected).toEqual({ acl: 'private' });
    expect(d.actual).toEqual({ acl: 'public-read' });
  });

  it('classifica delete (recurso sumiu da cloud) e create (recurso não gerenciado)', () => {
    const plan = {
      resource_drift: [
        { address: 'aws_instance.gone', change: { actions: ['delete'] } },
        { address: 'aws_instance.new', change: { actions: ['create'] } },
      ],
    };
    const drifts = parseTerraformDrift(plan);
    expect(drifts.map(d => d.driftType)).toEqual(['delete', 'create']);
  });

  it('retorna vazio quando não há resource_drift', () => {
    expect(parseTerraformDrift({})).toEqual([]);
    expect(parseTerraformDrift({ resource_drift: null })).toEqual([]);
    expect(parseTerraformDrift({ resource_changes: [{}] })).toEqual([]);
  });

  it('tolera entradas malformadas sem lançar', () => {
    const drifts = parseTerraformDrift({ resource_drift: [{}] });
    expect(drifts).toHaveLength(1);
    expect(drifts[0].resource).toBe('unknown');
    expect(drifts[0].driftType).toBe('update');
    expect(drifts[0].provider).toBeNull();
  });
});
