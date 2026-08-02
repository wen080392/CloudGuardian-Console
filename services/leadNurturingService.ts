import { prisma } from './db';
import { NotificationService } from './notificationService';
import type { SeveritySummary } from './instantAuditScoring';

/**
 * Nurturing por email do lead da "auditoria de 5 minutos" (Fase 7 — PLG).
 *
 * Sequência (Lead.nurtureStage):
 *   0 = lead capturado, nenhum email enviado
 *   1 = email imediato com o relatório enviado
 *   2 = follow-up de conversão enviado (fim da sequência)
 *
 * Leads convertidos (convertedTenantId preenchido) saem da sequência.
 * Tudo degrada sem SMTP configurado: a auditoria nunca falha por causa de email.
 */

export const FOLLOW_UP_DELAY_DAYS = 3;
const FOLLOW_UP_BATCH_SIZE = 50;

/** Base pública para links absolutos em emails (relatório PDF, registro). */
export function publicBaseUrl(): string {
  return (process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/+$/, '');
}

export interface ReportEmailInput {
  company?: string | null;
  score: number;
  summary: SeveritySummary;
  reportUrl: string; // caminho relativo retornado pela API
}

const scoreTone = (score: number) =>
  score >= 80
    ? 'Sua infraestrutura está em boa forma, mas os pontos abaixo merecem atenção.'
    : score >= 50
      ? 'Encontramos riscos relevantes que valem correção antes que virem incidente.'
      : 'Sua infraestrutura tem riscos sérios que pedem ação imediata.';

const sevLine = (label: string, count: number, color: string) =>
  count > 0
    ? `<li style="margin:4px 0"><strong style="color:${color}">${count}</strong> ${label}</li>`
    : '';

/** Conteúdo do email imediato pós-auditoria. Puro: fácil de testar. */
export function buildReportEmail(input: ReportEmailInput): { subject: string; html: string } {
  const { company, score, summary, reportUrl } = input;
  const base = publicBaseUrl();
  const absoluteReportUrl = `${base}${reportUrl}`;
  const who = company ? ` da ${company}` : '';
  const subject = `Sua auditoria CloudGuardian: score ${score}/100 — ${summary.total} risco(s) encontrado(s)`;
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
      <h2>Auditoria de segurança${who} concluída</h2>
      <p>Seu score de segurança: <strong style="font-size:24px">${score}/100</strong></p>
      <p>${scoreTone(score)}</p>
      <ul style="list-style:none;padding:0">
        ${sevLine('críticos', summary.critical, '#ef4444')}
        ${sevLine('altos', summary.high, '#f97316')}
        ${sevLine('médios', summary.medium, '#f59e0b')}
        ${sevLine('baixos', summary.low, '#3b82f6')}
      </ul>
      <p>
        <a href="${absoluteReportUrl}"
           style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
          Baixar relatório executivo (PDF)
        </a>
      </p>
      <p style="color:#64748b;font-size:13px">
        Quer varredura contínua, auto-remediação por PR e a Security Timeline?
        <a href="${base}/#/login">Crie sua conta grátis</a> — seus resultados já estarão lá.
      </p>
    </div>`;
  return { subject, html };
}

export interface FollowUpEmailInput {
  company?: string | null;
  score: number;
  totalFindings: number;
}

/** Conteúdo do follow-up de conversão (D+${FOLLOW_UP_DELAY_DAYS}). Puro. */
export function buildFollowUpEmail(input: FollowUpEmailInput): { subject: string; html: string } {
  const { company, score, totalFindings } = input;
  const base = publicBaseUrl();
  const who = company ? ` na ${company}` : '';
  const subject =
    totalFindings > 0
      ? `Os ${totalFindings} risco(s) da sua auditoria ainda estão abertos?`
      : 'Mantenha seu score 100 com varredura contínua';
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
      <h2>Como está a segurança${who}?</h2>
      <p>Há alguns dias sua auditoria CloudGuardian apontou um score de
         <strong>${score}/100</strong>${totalFindings > 0 ? ` com <strong>${totalFindings}</strong> risco(s)` : ''}.</p>
      <p>Uma auditoria pontual mostra a foto; segurança de verdade é o filme:
         cada PR verificado antes do merge, drift detectado e correções propostas automaticamente.</p>
      <p>
        <a href="${base}/#/login"
           style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
          Ativar varredura contínua grátis
        </a>
      </p>
      <p style="color:#64748b;font-size:13px">Se já resolveu tudo, ótimo — rode outra auditoria e comprove.</p>
    </div>`;
  return { subject, html };
}

export class LeadNurturingService {
  constructor(private notifier: NotificationService = new NotificationService()) {}

  /**
   * Email imediato com o resultado + link do PDF, disparado após a auditoria.
   * Nunca lança: falha de email não pode derrubar o funil PLG.
   */
  async sendAuditReportEmail(input: {
    leadId: string;
    email: string;
    company?: string | null;
    score: number;
    summary: SeveritySummary;
    reportUrl: string;
  }): Promise<boolean> {
    try {
      const { subject, html } = buildReportEmail(input);
      const sent = await this.notifier.sendDirectEmail(input.email, subject, html);
      if (!sent) return false; // SMTP não configurado — lead fica no estágio 0
      await prisma.lead.update({
        where: { id: input.leadId },
        data: { nurtureStage: 1, lastEmailAt: new Date() },
      });
      return true;
    } catch (e) {
      console.error(`Nurturing: falha ao enviar relatório ao lead ${input.leadId}:`, e);
      return false;
    }
  }

  /**
   * Follow-up de conversão para leads que receberam o relatório há
   * FOLLOW_UP_DELAY_DAYS+ dias e não viraram cliente. Chamado pelo scheduler.
   * Retorna quantos emails foram enviados.
   */
  async runFollowUpBatch(now: Date = new Date()): Promise<number> {
    if (!this.notifier.emailConfigured()) return 0;

    const cutoff = new Date(now.getTime() - FOLLOW_UP_DELAY_DAYS * 24 * 60 * 60 * 1000);
    const leads = await prisma.lead.findMany({
      where: {
        nurtureStage: 1,
        convertedTenantId: null,
        lastEmailAt: { lte: cutoff },
      },
      include: { audits: { orderBy: { createdAt: 'desc' }, take: 1 } },
      take: FOLLOW_UP_BATCH_SIZE,
    });

    let sent = 0;
    for (const lead of leads) {
      const audit = lead.audits[0];
      if (!audit) continue;
      try {
        const { subject, html } = buildFollowUpEmail({
          company: lead.company,
          score: audit.score,
          totalFindings: audit.totalFindings,
        });
        await this.notifier.sendDirectEmail(lead.email, subject, html);
        await prisma.lead.update({
          where: { id: lead.id },
          data: { nurtureStage: 2, lastEmailAt: now },
        });
        sent++;
      } catch (e) {
        // Continua o lote: um SMTP transitório não deve travar os demais leads
        console.error(`Nurturing: falha no follow-up do lead ${lead.id}:`, e);
      }
    }
    return sent;
  }
}

export const leadNurturingService = new LeadNurturingService();
