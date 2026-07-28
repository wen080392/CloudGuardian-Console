import crypto from 'crypto';
import { prisma } from './db';
import { scanTerraformNative } from './nativeEngine';
import { summarize, riskScore, topFindings, type SeveritySummary, type ExecutiveFinding } from './instantAuditScoring';

export { summarize, riskScore, topFindings } from './instantAuditScoring';
export type { SeveritySummary, ExecutiveFinding } from './instantAuditScoring';

export interface InstantAuditResult {
  auditId: string;
  score: number;
  engine: 'native';
  summary: SeveritySummary;
  topFindings: ExecutiveFinding[];
  downloadToken: string;
}

export class InstantAuditService {
  /**
   * Roda a auditoria de 5 minutos sobre Terraform colado por um lead anônimo.
   * Usa o motor nativo (não depende de Checkov/infra externa), captura o lead
   * e persiste o resultado para geração do PDF executivo.
   */
  async run(input: { email: string; company?: string; terraform: string }): Promise<InstantAuditResult> {
    const { findings } = scanTerraformNative(input.terraform);
    const summary = summarize(findings);
    const score = riskScore(summary);
    const top = topFindings(findings);
    const downloadToken = crypto.randomBytes(24).toString('hex');

    const lead = await prisma.lead.create({
      data: { email: input.email, company: input.company, source: 'instant-audit' },
    });

    const audit = await prisma.instantAudit.create({
      data: {
        leadId: lead.id,
        score,
        engine: 'native',
        totalFindings: summary.total,
        summary: summary as any,
        findings: top as any,
        downloadToken,
      },
    });

    return { auditId: audit.id, score, engine: 'native', summary, topFindings: top, downloadToken };
  }

  /** Recupera uma auditoria validando o token de download (anti-enumeração). */
  async getByToken(auditId: string, token: string) {
    const audit = await prisma.instantAudit.findUnique({
      where: { id: auditId },
      include: { lead: true },
    });
    if (!audit || audit.downloadToken !== token) return null;
    return audit;
  }
}

export const instantAuditService = new InstantAuditService();
