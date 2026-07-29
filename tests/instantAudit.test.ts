// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { summarize, riskScore, topFindings } from '../services/instantAuditScoring';
import type { NativeFinding } from '../services/nativeEngine';

const f = (severity: NativeFinding['severity'], ruleId = 'R', title = 'T'): NativeFinding => ({
  ruleId, title, description: 'd', severity, resource: 'aws_x.y', line: 1,
  remediation: 'fix', engine: 'native',
});

describe('summarize', () => {
  it('conta por severidade e total', () => {
    const s = summarize([f('critical'), f('critical'), f('high'), f('low')]);
    expect(s).toEqual({ critical: 2, high: 1, medium: 0, low: 1, total: 4 });
  });

  it('lista vazia zera tudo', () => {
    expect(summarize([])).toEqual({ critical: 0, high: 0, medium: 0, low: 0, total: 0 });
  });
});

describe('riskScore', () => {
  it('100 quando não há findings', () => {
    expect(riskScore(summarize([]))).toBe(100);
  });

  it('penaliza por severidade e é determinístico', () => {
    const s = summarize([f('critical'), f('high')]); // 20 + 10
    expect(riskScore(s)).toBe(70);
    expect(riskScore(s)).toBe(70); // mesma entrada, mesmo score
  });

  it('nunca fica abaixo de 0', () => {
    const many = Array.from({ length: 20 }, () => f('critical'));
    expect(riskScore(summarize(many))).toBe(0);
  });
});

describe('topFindings', () => {
  it('ordena por severidade (critical primeiro) e limita', () => {
    const findings = [f('low', 'L'), f('critical', 'C'), f('medium', 'M'), f('high', 'H')];
    const top = topFindings(findings, 3);
    expect(top.map(t => t.ruleId)).toEqual(['C', 'H', 'M']);
    expect(top[0]).toMatchObject({ severity: 'critical', resource: 'aws_x.y', remediation: 'fix' });
  });
});
