import cron from 'node-cron';
import { prisma } from './db';
import { ReportService } from './reportService';
import { uploadPDF, getPDFUrl } from './storageService';

const reportService = new ReportService();

import { addReportJob } from './queueService';

// Todo primeiro dia do mês às 00:00
cron.schedule('0 0 1 * *', async () => {
  console.log('📅 Iniciando geração automática de relatórios mensais via filas...');

  // Buscar tenants com planos que permitem relatórios (ex: Pro, Business, Enterprise)
  // Our schema doesn't have a plan field on tenant directly, let's just fetch all for now or check users
  const tenants = await prisma.tenant.findMany();

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  const period = {
    start,
    end,
    label: `${start.toLocaleString('default', { month: 'long' })} ${start.getFullYear()}`,
  };

  for (const tenant of tenants) {
    // Gerar para CIS, SOC2, HIPAA enfileirando as tarefas para os workers
    for (const framework of ['CIS', 'SOC2', 'HIPAA']) {
      addReportJob({ tenantId: tenant.id, framework, period });
    }
  }
});

// Opcional: relatório semanal para Business/Enterprise (domingo 00:00)
cron.schedule('0 0 * * 0', async () => {
  console.log('📅 Geração de relatórios semanais...');
});

console.log('⏰ Scheduler de relatórios iniciado.');
