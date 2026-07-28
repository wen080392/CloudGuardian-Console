import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import path from "path";
import fs from "fs";
import * as Sentry from "@sentry/node";
import * as dotenv from "dotenv";
import { addContentScanJob } from './services/queueService';
import { prisma } from './services/db';
import authRouter from './routes/auth';
import instantAuditRouter from './routes/instantAudit';
import stripeRouter from './routes/stripe';
import assetsRouter from './routes/assets';
import vulnerabilitiesRouter from './routes/vulnerabilities';
import finopsRouter from './routes/finops';
import webhookRouter from './routes/webhook';
import policiesRouter from './routes/policies';
import driftsRouter from './routes/drifts';
import timelineRouter from './routes/timeline';
import reportsRouter from './routes/reports';
import notificationsRouter from './routes/notifications';
import credentialsRouter from './routes/credentials';
import auditRouter from './routes/audit';
import advisorRouter from './routes/advisor';
import projectsRouter from './routes/projects';
import organizationRouter from './routes/organization';
import { authMiddleware } from './middleware/auth';
import { auditMiddleware } from './middleware/auditMiddleware';
import './services/schedulerService';

dotenv.config();

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    environment: process.env.NODE_ENV || 'development',
  });
}

async function startServer() {
  const app = express();

  const PORT = Number(process.env.PORT) || 3000;
  app.get("/ping", (req, res) => res.send("pong"));

  // Webhook needs raw body
  app.use('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }));

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false
  }));

  // Global Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window`
    standardHeaders: true, 
    legacyHeaders: false, 
    message: { error: 'Muitas requisições deste IP, tente novamente mais tarde.' }
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request Logger — never log request bodies: they may contain
  // cloud credentials, tokens or IaC source code
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

  // Apply rate limiter to all API routes
  app.use('/api/', limiter);

  // API Routes (Public)
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/stripe', stripeRouter);
  // Auditoria de 5 minutos (PLG) — pública, com rate limit próprio
  app.use('/api/v1/audit', instantAuditRouter);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "CloudGuardian API", version: "1.0.0" });
  });

  // Webhook integration
  app.use('/webhook', webhookRouter);

  // Protect all routes below this line
  app.use('/api/v1', authMiddleware, auditMiddleware);

  // Protected Routes
  app.use('/api/v1/assets', assetsRouter);
  app.use('/api/v1/vulnerabilities', vulnerabilitiesRouter);
  app.use('/api/v1/finops', finopsRouter);
  app.use('/api/v1/policies', policiesRouter);
  app.use('/api/v1/drifts', driftsRouter);
  app.use('/api/v1/timeline', timelineRouter);
  app.use('/api/v1/reports', reportsRouter);
  app.use('/api/v1/notifications', notificationsRouter);
  app.use('/api/v1/credentials', credentialsRouter);
  app.use('/api/v1/audit', auditRouter);
  app.use('/api/v1/advisor', advisorRouter);
  app.use('/api/v1/projects', projectsRouter);
  app.use('/api/v1/organization', organizationRouter);

  // Serve locally stored report PDFs (auth required — mounted under /api/v1)
  app.get('/api/v1/reports/download/:filename', (req, res) => {
    // basename() strips any directory component, blocking path traversal
    const filename = path.basename(req.params.filename);
    if (!/^[\w.-]+\.pdf$/i.test(filename)) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    const reportsDir = path.join(process.cwd(), 'uploads', 'reports');
    const filePath = path.resolve(reportsDir, filename);
    if (!filePath.startsWith(reportsDir + path.sep) || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(filePath);
  });

  // Real Scans Endpoint
  app.post("/api/v1/scans", async (req, res) => {
    const { content } = req.body ?? {};

    if (typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ detail: "Content is required for scanning." });
    }
    if (content.length > 1_000_000) {
      return res.status(413).json({ detail: "Content too large (max 1MB)." });
    }

    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(403).json({ error: 'Tenant context is missing.' });
      }

      // Persiste o scan como pending e processa via fila (serializa execuções
      // do Checkov em vez de rodar N scans em paralelo no processo da API)
      const scan = await prisma.scan.create({
        data: { tenantId, status: 'pending', fullCode: content },
      });
      const { done } = addContentScanJob({ scanId: scan.id, tenantId, content });

      // Modo síncrono compatível com a UI: aguarda até 45s pela conclusão
      const SYNC_TIMEOUT_MS = 45_000;
      const finished = await Promise.race([
        done.then(() => true).catch(() => true),
        new Promise<false>(resolve => setTimeout(() => resolve(false), SYNC_TIMEOUT_MS)),
      ]);

      const current = await prisma.scan.findUnique({ where: { id: scan.id } });
      if (!finished || !current || current.status === 'pending' || current.status === 'running') {
        // Ainda processando — cliente consulta GET /api/v1/scans/:id
        return res.status(202).json({ id: scan.id, status: current?.status ?? 'pending' });
      }
      if (current.status === 'failed') {
        return res.status(500).json({ id: current.id, status: 'failed', detail: current.error });
      }
      res.json({
        id: current.id,
        status: current.status,
        output_data: current.result ?? { security_issues: [] },
      });
    } catch (error) {
      console.error("Scan failed:", error);
      res.status(500).json({ detail: "Internal Server Error during scan execution." });
    }
  });

  // Status de um scan (para o modo assíncrono/polling)
  app.get("/api/v1/scans/:id", async (req, res): Promise<any> => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });
    const id = String(req.params.id);
    try {
      const scan = await prisma.scan.findFirst({
        where: { id, OR: [{ tenantId }, { project: { tenantId } }] },
      });
      if (!scan) return res.status(404).json({ error: 'Scan não encontrado' });
      res.json({
        id: scan.id,
        status: scan.status,
        vulnsCount: scan.vulnsCount,
        startedAt: scan.startedAt,
        finishedAt: scan.finishedAt,
        error: scan.error,
        output_data: scan.status === 'completed' ? scan.result : undefined,
      });
    } catch (error) {
      console.error('Failed to fetch scan:', error);
      res.status(500).json({ error: 'Failed to fetch scan' });
    }
  });

  app.get("/api/v1/scans/history", async (req, res): Promise<any> => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });
    try {
      const scans = await prisma.scan.findMany({
        where: { OR: [{ tenantId }, { project: { tenantId } }] },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { project: { select: { name: true, score: true } } },
      });
      res.json(scans.map(s => ({
        id: s.id,
        timestamp: s.createdAt.toISOString(),
        score: s.project?.score ?? null,
        vulnsCount: s.vulnsCount,
        status: s.status,
        projectName: s.project?.name ?? 'Scan ad-hoc',
      })));
    } catch (error) {
      console.error('Failed to fetch scan history:', error);
      res.status(500).json({ error: 'Failed to fetch scan history' });
    }
  });

  app.get("/api/v1/guardrails", async (req, res): Promise<any> => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(403).json({ error: 'Tenant context is missing.' });
    try {
      const policies = await prisma.policy.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });
      res.json(policies.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        resourceType: p.type,
        logic: p.regoCode,
        severity: p.severity.toUpperCase(),
        status: p.enabled ? 'enabled' : 'disabled',
      })));
    } catch (error) {
      console.error('Failed to fetch guardrails:', error);
      res.status(500).json({ error: 'Failed to fetch guardrails' });
    }
  });

  // 404 handler for unmatched API routes (static/SPA fallback handles the rest)
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // The error handler must be before any other error middleware and after all controllers
  Sentry.setupExpressErrorHandler(app);

  // Vite middleware removed to bypass NPM hang
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*all', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  const httpServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Shutdown gracioso: fecha o HTTP e drena a fila (Redis) antes de sair
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} recebido — encerrando graciosamente…`);
    httpServer.close();
    try {
      const { closeQueueDriver } = await import('./services/queue');
      await closeQueueDriver();
    } catch (e) {
      console.error('Erro no shutdown da fila:', e);
    }
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

startServer();
