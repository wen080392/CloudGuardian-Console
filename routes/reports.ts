import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';
import { ReportService } from '../services/reportService';
import { uploadPDF, getPDFUrl } from '../services/storageService';

const router = Router();
const reportService = new ReportService();

// GET /api/v1/reports – Listar relatórios
router.get('/', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context missing' });
  const { framework, status } = req.query;

  try {
    const reports = await prisma.complianceReport.findMany({
      where: {
        tenantId,
        framework: framework && framework !== 'all' ? String(framework) : undefined,
        status: status ? String(status) : undefined,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reports);
  } catch (error) {
    console.error('Erro ao listar relatórios:', error);
    res.status(500).json({ error: 'Erro ao listar relatórios' });
  }
});

// POST /api/v1/reports – Gerar novo relatório
router.post('/', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context missing' });
  const { framework, period } = req.body; 

  try {
    const { report, pdfBuffer } = await reportService.generateReport(tenantId, framework, {
        start: new Date(period.start),
        end: new Date(period.end),
        label: period.label
    });

    const key = `reports/${tenantId}/${framework}/${Date.now()}.pdf`;
    await uploadPDF(key, pdfBuffer);

    await prisma.complianceReport.update({
        where: { id: report.id },
        data: { pdfUrl: key }
    });

    // Envia o PDF diretamente em caso de mock
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="report-${framework}-${Date.now()}.pdf"`);
        return res.send(pdfBuffer);
    }

    const downloadUrl = await getPDFUrl(key);
    res.redirect(downloadUrl);
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

// GET /api/v1/reports/:id/download – Baixar relatório existente
router.get('/:id/download', async (req: Request, res: Response): Promise<any> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant context missing' });
  const id = String(req.params.id);
  try {
    const report = await prisma.complianceReport.findFirst({
        where: { id, tenantId }
    });
    if (!report) return res.status(404).json({ error: 'Relatório não encontrado' });
    if (!report.pdfUrl) return res.status(400).json({ error: 'Nenhum PDF associado' });

    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
         return res.status(501).json({ error: 'Download do histórico requer credenciais AWS' });
    }

    const url = await getPDFUrl(report.pdfUrl);
    res.redirect(url);
  } catch(error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Error' });
  }
});

export default router;
