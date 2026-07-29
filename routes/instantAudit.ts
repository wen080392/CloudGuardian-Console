import { Router, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { instantAuditService } from '../services/instantAuditService';
import { PDFGenerator } from '../services/pdfGenerator';

const router = Router();

// Rate limit estrito: é um endpoint público (sem auth). Protege contra abuso.
const auditLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,                    // 5 auditorias por IP/hora
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de auditorias atingido. Tente novamente mais tarde ou crie uma conta.' },
});

const instantAuditSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    company: z.string().max(120).optional(),
    // Só aceita conteúdo Terraform colado — auditar repos arbitrários sem
    // auth seria um vetor de SSRF/abuso; repos exigem conta + projeto.
    terraform: z.string().min(1).max(500_000),
  }),
});

// POST /api/v1/audit/instant — auditoria de 5 minutos (PLG, público)
router.post('/instant', auditLimiter, validate(instantAuditSchema), async (req: Request, res: Response): Promise<any> => {
  const { email, company, terraform } = req.body;
  try {
    const result = await instantAuditService.run({ email, company, terraform });
    res.status(201).json({
      auditId: result.auditId,
      score: result.score,
      engine: result.engine,
      summary: result.summary,
      topFindings: result.topFindings,
      reportUrl: `/api/v1/audit/instant/${result.auditId}/report.pdf?token=${result.downloadToken}`,
    });
  } catch (error) {
    console.error('Erro na auditoria instantânea:', error);
    res.status(500).json({ error: 'Falha ao executar a auditoria' });
  }
});

// GET /api/v1/audit/instant/:id/report.pdf?token=... — PDF executivo (público via token)
router.get('/instant/:id/report.pdf', async (req: Request, res: Response): Promise<any> => {
  const id = String(req.params.id);
  const token = String(req.query.token || '');
  try {
    const audit = await instantAuditService.getByToken(id, token);
    if (!audit) return res.status(404).json({ error: 'Auditoria não encontrada' });

    const summary = audit.summary as any;
    const findings = (audit.findings as any[]) || [];

    const reportData = {
      title: 'CloudGuardian — Auditoria de Segurança',
      company: audit.lead?.company || audit.lead?.email || 'Sua empresa',
      framework: 'CIS / IaC',
      period: new Date().toLocaleDateString('pt-BR'),
      generatedAt: new Date().toISOString(),
      summary: {
        totalVulnerabilities: summary.total ?? 0,
        criticalVulnerabilities: summary.critical ?? 0,
        highVulnerabilities: summary.high ?? 0,
        mediumVulnerabilities: summary.medium ?? 0,
        lowVulnerabilities: summary.low ?? 0,
        complianceScore: audit.score,
      },
      vulnerabilities: findings.map(f => ({
        title: f.title, severity: f.severity, resourceId: f.resource,
        ruleId: f.ruleId, status: 'open',
      })),
      findings: findings.map(f => ({
        severity: f.severity,
        description: `${f.ruleId}: ${f.title} (${f.resource})`,
        recommendation: f.remediation,
      })),
    };

    const pdf = await new PDFGenerator().generateExecutiveReport(reportData);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="cloudguardian-audit.pdf"');
    res.send(pdf);
  } catch (error) {
    console.error('Erro ao gerar PDF da auditoria:', error);
    res.status(500).json({ error: 'Falha ao gerar o relatório' });
  }
});

export default router;
