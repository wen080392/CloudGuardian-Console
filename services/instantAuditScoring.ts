import type { NativeFinding, Severity } from './nativeEngine';

export interface SeveritySummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface ExecutiveFinding {
  ruleId: string;
  title: string;
  severity: Severity;
  resource: string;
  remediation: string;
}

/** Conta findings por severidade. Função pura. */
export function summarize(findings: NativeFinding[]): SeveritySummary {
  const s: SeveritySummary = { critical: 0, high: 0, medium: 0, low: 0, total: findings.length };
  for (const f of findings) s[f.severity]++;
  return s;
}

/**
 * Score de risco 0–100 (100 = sem riscos). Penaliza por severidade.
 * Função pura, determinística — a mesma entrada dá sempre o mesmo score.
 */
export function riskScore(summary: SeveritySummary): number {
  const penalty = summary.critical * 20 + summary.high * 10 + summary.medium * 4 + summary.low * 1;
  return Math.max(0, Math.min(100, 100 - penalty));
}

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

/** Top N findings ordenados por severidade, para o resumo executivo. */
export function topFindings(findings: NativeFinding[], n = 10): ExecutiveFinding[] {
  return [...findings]
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    .slice(0, n)
    .map(f => ({
      ruleId: f.ruleId,
      title: f.title,
      severity: f.severity,
      resource: f.resource,
      remediation: f.remediation,
    }));
}
