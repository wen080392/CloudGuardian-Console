import express from "express";
import helmet, { rateLimit } from "./middleware/mock_security";
import path from "path";
import Sentry from "./middleware/mock_sentry";
import * as dotenv from "dotenv";
import { scannerService } from './services/scannerService';
import { prisma } from './services/db';
import authRouter from './routes/auth';
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

// Start background worker for schedules scans
scannerService.startWorker();

async function startServer() {
  const app = express();

  // Initialize Sentry
  Sentry.init({
    dsn: process.env.SENTRY_DSN || "",
    tracesSampleRate: 1.0,
  });

  // The request handler must be the first middleware on the app
  app.use(Sentry.Handlers.requestHandler());
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());

  const PORT = process.env.PORT || 3000;
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

  // Request Logger
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
  });

  // Apply rate limiter to all API routes
  app.use('/api/', limiter);

  // API Routes (Public)
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/stripe', stripeRouter);

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

  // Serve locally stored report PDFs
  app.get('/api/v1/reports/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', 'reports', filename);
    if (require('fs').existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  });

  // Real Scans Endpoint
  app.post("/api/v1/scans", async (req, res) => {
    const { content, scan_type } = req.body;
    
    if (!content) {
      return res.status(400).json({ detail: "Content is required for scanning." });
    }

    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(403).json({ error: 'Tenant context is missing.' });
      }

      // Use the new ScannerService to run Checkov (or simulate)
      const vulnerabilities = await scannerService.scanTerraform(content, tenantId);
      
      res.json({
        id: Date.now(),
        status: "completed",
        output_data: {
          security_issues: vulnerabilities
        }
      });
    } catch (error) {
      console.error("Scan failed:", error);
      res.status(500).json({ detail: "Internal Server Error during scan execution." });
    }
  });

  app.get("/api/v1/scans/history", (req, res) => {
    res.json([
      { id: 1, timestamp: new Date().toISOString(), score: 85, status: 'completed' },
      { id: 2, timestamp: new Date(Date.now() - 86400000).toISOString(), score: 78, status: 'completed' }
    ]);
  });

  app.get("/api/v1/guardrails", (req, res) => {
    res.json([
      { id: 'gr-1', name: 'S3 Public Block', description: 'Impedir buckets públicos.', resourceType: 'aws_s3_bucket', logic: 'acl != "public-read"', severity: 'CRITICAL', status: 'enabled' }
    ]);
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());

  // Vite middleware removed to bypass NPM hang
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*all', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
