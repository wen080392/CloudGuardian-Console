// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Banco em memória minimalista para Lead/InstantAudit
interface MemLead {
  id: string;
  email: string;
  company: string | null;
  nurtureStage: number;
  lastEmailAt: Date | null;
  convertedTenantId: string | null;
}
interface MemAudit {
  id: string;
  leadId: string;
  score: number;
  totalFindings: number;
  convertedTenantId: string | null;
  createdAt: Date;
}

const db = { leads: [] as MemLead[], audits: [] as MemAudit[] };

vi.mock('../services/db', () => ({
  prisma: {
    lead: {
      findMany: async ({ where, include, take }: any) => {
        let rows = db.leads.filter(l => {
          if (where.email !== undefined && l.email !== where.email) return false;
          if (where.nurtureStage !== undefined && l.nurtureStage !== where.nurtureStage) return false;
          if ('convertedTenantId' in where && l.convertedTenantId !== where.convertedTenantId) return false;
          if (where.lastEmailAt?.lte && (!l.lastEmailAt || l.lastEmailAt > where.lastEmailAt.lte)) return false;
          return true;
        });
        if (take) rows = rows.slice(0, take);
        return rows.map(l => ({
          ...l,
          ...(include?.audits
            ? {
                audits: db.audits
                  .filter(a => a.leadId === l.id)
                  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                  .slice(0, include.audits.take ?? undefined),
              }
            : {}),
        }));
      },
      update: async ({ where, data }: any) => {
        const l = db.leads.find(l => l.id === where.id);
        if (!l) throw new Error('lead não encontrado');
        Object.assign(l, data);
        return l;
      },
      updateMany: async ({ where, data }: any) => {
        const targets = db.leads.filter(l => where.id.in.includes(l.id));
        targets.forEach(l => Object.assign(l, data));
        return { count: targets.length };
      },
    },
    instantAudit: {
      updateMany: async ({ where, data }: any) => {
        const targets = db.audits.filter(
          a => where.leadId.in.includes(a.leadId) && a.convertedTenantId === where.convertedTenantId
        );
        targets.forEach(a => Object.assign(a, data));
        return { count: targets.length };
      },
    },
  },
}));

import {
  LeadNurturingService,
  buildReportEmail,
  buildFollowUpEmail,
  FOLLOW_UP_DELAY_DAYS,
} from '../services/leadNurturingService';
import { InstantAuditService } from '../services/instantAuditService';
import type { NotificationService } from '../services/notificationService';

const summary = { critical: 2, high: 1, medium: 0, low: 1, total: 4 };
const DAY = 24 * 60 * 60 * 1000;

let seq = 0;
const addLead = (over: Partial<MemLead> = {}): MemLead => {
  const lead: MemLead = {
    id: `lead-${++seq}`, email: `l${seq}@x.com`, company: null,
    nurtureStage: 0, lastEmailAt: null, convertedTenantId: null, ...over,
  };
  db.leads.push(lead);
  return lead;
};
const addAudit = (leadId: string, over: Partial<MemAudit> = {}): MemAudit => {
  const audit: MemAudit = {
    id: `audit-${++seq}`, leadId, score: 40, totalFindings: 4,
    convertedTenantId: null, createdAt: new Date(), ...over,
  };
  db.audits.push(audit);
  return audit;
};

// Notifier fake: registra envios sem SMTP real
function fakeNotifier(configured = true) {
  const sent: { to: string; subject: string; html: string }[] = [];
  const notifier = {
    emailConfigured: () => configured,
    sendDirectEmail: async (to: string, subject: string, html: string) => {
      if (!configured) return false;
      sent.push({ to, subject, html });
      return true;
    },
  } as unknown as NotificationService;
  return { notifier, sent };
}

beforeEach(() => {
  db.leads.length = 0;
  db.audits.length = 0;
  seq = 0;
});

describe('buildReportEmail', () => {
  it('inclui score, contagens e link absoluto do PDF', () => {
    const { subject, html } = buildReportEmail({
      company: 'Acme', score: 40, summary,
      reportUrl: '/api/v1/audit/instant/a1/report.pdf?token=t',
    });
    expect(subject).toContain('40/100');
    expect(subject).toContain('4 risco(s)');
    expect(html).toContain('/api/v1/audit/instant/a1/report.pdf?token=t');
    expect(html).toMatch(/href="https?:\/\/[^"]+\/api\/v1\/audit/); // absoluto, não relativo
    expect(html).toContain('Acme');
    expect(html).toContain('<strong style="color:#ef4444">2</strong>');
  });

  it('respeita PUBLIC_BASE_URL sem barra dupla', () => {
    process.env.PUBLIC_BASE_URL = 'https://cg.example.com/';
    try {
      const { html } = buildReportEmail({ score: 90, summary, reportUrl: '/x.pdf' });
      expect(html).toContain('https://cg.example.com/x.pdf');
      expect(html).not.toContain('example.com//x.pdf');
    } finally {
      delete process.env.PUBLIC_BASE_URL;
    }
  });
});

describe('buildFollowUpEmail', () => {
  it('cita os riscos abertos quando existem', () => {
    const { subject, html } = buildFollowUpEmail({ company: 'Acme', score: 40, totalFindings: 4 });
    expect(subject).toContain('4 risco(s)');
    expect(html).toContain('40/100');
  });

  it('usa copy de score limpo quando não há findings', () => {
    const { subject } = buildFollowUpEmail({ score: 100, totalFindings: 0 });
    expect(subject).toContain('score 100');
  });
});

describe('sendAuditReportEmail', () => {
  it('envia e avança o lead para o estágio 1', async () => {
    const lead = addLead();
    const { notifier, sent } = fakeNotifier();
    const svc = new LeadNurturingService(notifier);

    const ok = await svc.sendAuditReportEmail({
      leadId: lead.id, email: lead.email, score: 40, summary, reportUrl: '/r.pdf',
    });

    expect(ok).toBe(true);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe(lead.email);
    expect(lead.nurtureStage).toBe(1);
    expect(lead.lastEmailAt).toBeInstanceOf(Date);
  });

  it('sem SMTP: não envia e lead permanece no estágio 0', async () => {
    const lead = addLead();
    const { notifier, sent } = fakeNotifier(false);
    const svc = new LeadNurturingService(notifier);

    const ok = await svc.sendAuditReportEmail({
      leadId: lead.id, email: lead.email, score: 40, summary, reportUrl: '/r.pdf',
    });

    expect(ok).toBe(false);
    expect(sent).toHaveLength(0);
    expect(lead.nurtureStage).toBe(0);
  });

  it('nunca lança mesmo com falha de envio (funil não pode cair)', async () => {
    const lead = addLead();
    const notifier = {
      emailConfigured: () => true,
      sendDirectEmail: async () => { throw new Error('SMTP down'); },
    } as unknown as NotificationService;
    const svc = new LeadNurturingService(notifier);

    const ok = await svc.sendAuditReportEmail({
      leadId: lead.id, email: lead.email, score: 40, summary, reportUrl: '/r.pdf',
    });

    expect(ok).toBe(false);
    expect(lead.nurtureStage).toBe(0);
  });
});

describe('runFollowUpBatch', () => {
  const now = new Date('2026-08-02T10:00:00Z');
  const oldEnough = new Date(now.getTime() - (FOLLOW_UP_DELAY_DAYS + 1) * DAY);
  const tooRecent = new Date(now.getTime() - 1 * DAY);

  it('envia follow-up só para estágio 1, antigo e não convertido; avança para 2', async () => {
    const due = addLead({ nurtureStage: 1, lastEmailAt: oldEnough });
    addAudit(due.id, { score: 35, totalFindings: 6 });

    const recent = addLead({ nurtureStage: 1, lastEmailAt: tooRecent });
    addAudit(recent.id);
    const converted = addLead({ nurtureStage: 1, lastEmailAt: oldEnough, convertedTenantId: 't-1' });
    addAudit(converted.id);
    const stage0 = addLead({ nurtureStage: 0 });
    addAudit(stage0.id);
    const done = addLead({ nurtureStage: 2, lastEmailAt: oldEnough });
    addAudit(done.id);

    const { notifier, sent } = fakeNotifier();
    const count = await new LeadNurturingService(notifier).runFollowUpBatch(now);

    expect(count).toBe(1);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe(due.email);
    expect(sent[0].subject).toContain('6 risco(s)');
    expect(due.nurtureStage).toBe(2);
    expect(due.lastEmailAt).toEqual(now);
    expect(recent.nurtureStage).toBe(1);
    expect(converted.nurtureStage).toBe(1);
    expect(done.nurtureStage).toBe(2);
  });

  it('no-op sem SMTP configurado', async () => {
    const due = addLead({ nurtureStage: 1, lastEmailAt: oldEnough });
    addAudit(due.id);

    const { notifier, sent } = fakeNotifier(false);
    const count = await new LeadNurturingService(notifier).runFollowUpBatch(now);

    expect(count).toBe(0);
    expect(sent).toHaveLength(0);
    expect(due.nurtureStage).toBe(1);
  });

  it('falha num lead não trava o restante do lote', async () => {
    const a = addLead({ nurtureStage: 1, lastEmailAt: oldEnough });
    addAudit(a.id);
    const b = addLead({ nurtureStage: 1, lastEmailAt: oldEnough });
    addAudit(b.id);

    let calls = 0;
    const notifier = {
      emailConfigured: () => true,
      sendDirectEmail: async () => {
        if (++calls === 1) throw new Error('SMTP flake');
        return true;
      },
    } as unknown as NotificationService;

    const count = await new LeadNurturingService(notifier).runFollowUpBatch(now);
    expect(count).toBe(1);
    expect([a.nurtureStage, b.nurtureStage].sort()).toEqual([1, 2]);
  });
});

describe('markLeadConverted', () => {
  it('marca leads e auditorias do email como convertidos', async () => {
    const lead = addLead({ email: 'ana@acme.com', nurtureStage: 1 });
    const audit = addAudit(lead.id);
    const other = addLead({ email: 'outro@x.com' });
    const otherAudit = addAudit(other.id);

    const count = await new InstantAuditService().markLeadConverted('ana@acme.com', 'tenant-9');

    expect(count).toBe(1);
    expect(lead.convertedTenantId).toBe('tenant-9');
    expect(audit.convertedTenantId).toBe('tenant-9');
    expect(other.convertedTenantId).toBeNull();
    expect(otherAudit.convertedTenantId).toBeNull();
  });

  it('é idempotente: lead já convertido não é sobrescrito', async () => {
    const lead = addLead({ email: 'ana@acme.com', convertedTenantId: 'tenant-1' });
    addAudit(lead.id, { convertedTenantId: 'tenant-1' });

    const count = await new InstantAuditService().markLeadConverted('ana@acme.com', 'tenant-2');

    expect(count).toBe(0);
    expect(lead.convertedTenantId).toBe('tenant-1');
  });

  it('retorna 0 para email que nunca rodou auditoria', async () => {
    const count = await new InstantAuditService().markLeadConverted('nunca@x.com', 't');
    expect(count).toBe(0);
  });
});
