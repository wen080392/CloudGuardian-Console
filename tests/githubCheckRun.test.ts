// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { buildCheckRunPayload } from '../services/githubAppService';

describe('buildCheckRunPayload', () => {
  const base = { headSha: 'abc123', engine: 'checkov', passed: 10 };

  it('conclui failure quando há violação crítica ou alta', () => {
    const p = buildCheckRunPayload({
      ...base, failed: 1,
      vulnerabilities: [{ title: 'S3 público', severity: 'critical', filePath: 'main.tf', line: 5 }],
    });
    expect(p.conclusion).toBe('failure');
    expect(p.head_sha).toBe('abc123');
    expect(p.output.annotations[0]).toMatchObject({
      path: 'main.tf', start_line: 5, annotation_level: 'failure',
    });
  });

  it('conclui success quando só há violações médias/baixas', () => {
    const p = buildCheckRunPayload({
      ...base, failed: 2,
      vulnerabilities: [
        { title: 'EBS sem cripto', severity: 'medium', filePath: 'ebs.tf', line: 3 },
        { title: 'S3 sem log', severity: 'low', filePath: 's3.tf', line: 1 },
      ],
    });
    expect(p.conclusion).toBe('success');
    expect(p.output.annotations.map(a => a.annotation_level)).toEqual(['warning', 'notice']);
  });

  it('limita a 50 anotações e menciona o excedente no resumo', () => {
    const vulns = Array.from({ length: 60 }, (_, i) => ({
      title: `V${i}`, severity: 'high', filePath: `f${i}.tf`, line: i + 1,
    }));
    const p = buildCheckRunPayload({ ...base, failed: 60, vulnerabilities: vulns });
    expect(p.output.annotations).toHaveLength(50);
    expect(p.output.summary).toContain('não anotadas inline');
  });

  it('não anota vulnerabilidades sem filePath, mas conta no failed', () => {
    const p = buildCheckRunPayload({
      ...base, failed: 1,
      vulnerabilities: [{ title: 'Sem arquivo', severity: 'high', filePath: null }],
    });
    expect(p.output.annotations).toHaveLength(0);
    expect(p.conclusion).toBe('failure'); // ainda bloqueia
  });

  it('normaliza linha inválida para 1', () => {
    const p = buildCheckRunPayload({
      ...base, failed: 1,
      vulnerabilities: [{ title: 'X', severity: 'high', filePath: 'a.tf', line: 0 }],
    });
    expect(p.output.annotations[0].start_line).toBe(1);
  });
});
