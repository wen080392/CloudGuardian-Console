# 🗺️ CloudGuardian: Roadmap Técnico

> Documento canônico do estado técnico do projeto. O plano de negócios vive em
> `docs/BUSINESS_PLAN_AND_ROADMAP.md`.

## ✅ Concluído

### Frontend & UX
- Core UI/Layout (`Sidebar`, `Header`, `App.tsx`), Dashboard HUD, Scanner UI com diffs,
  grafo de recursos, War Room, integração Gemini (`geminiService.ts`, `AIAssistant`).

### Backend & Segurança (Fase 1 — Segurança Crítica)
- **API Express real** (`server.ts` + `routes/`) com PostgreSQL/Prisma (`services/db.ts`)
  — o mock de banco foi removido; `DATABASE_URL` é obrigatória.
- **Headers de segurança e rate limiting reais** (`helmet`, `express-rate-limit`) e
  Sentry opcional via `SENTRY_DSN`.
- **Criptografia fail-closed de credenciais** (`services/encryptionService.ts` + AWS KMS):
  nunca persiste plaintext; produção exige `AWS_KMS_KEY_ID`.
- **Validação de entrada real com zod** (`middleware/validate.ts`).
- Download de relatórios protegido contra path traversal; logger sem body de requests.

### Qualidade (Fase 2)
- **Provisionamento atômico de usuário/tenant** sem condição de corrida
  (`services/userProvisioningService.ts`), usado pelo `authMiddleware` e `/auth/register`.
- **Suite de testes** (`tests/`): auth middleware, isolamento multi-tenant,
  criptografia fail-closed, provisionamento concorrente.
- **CI GitHub Actions** (`.github/workflows/ci.yml`): type-check + testes + build em cada PR.
- Endpoints ligados ao banco (sem dados de demonstração hardcoded).

## 🚧 Em andamento / Próximos passos

### Arquitetura (Fase 3)
- [x] Multi-tenancy defensivo no schema (`tenantId` obrigatório + índices).
- [x] Scans assíncronos com status persistido no modelo `Scan`.

### Motor & Confiança (Fase 5) — ver `docs/PHASE5_ENGINE.md`
- [x] Fim do fallback simulado enganoso; todo scan carrega o `engine` usado.
- [x] Motor de regras nativo real (`services/nativeEngine.ts`), testado.
- [x] Runner do Checkov em container isolado (sem rede, read-only, sem privilégios).
- [x] Webhook do GitHub fail-closed com assinatura HMAC timing-safe.
- [x] Clone de PR sem injeção de shell (execFile + validação de entrada).
- [x] Fixar a imagem do Checkov por digest em produção. *(configurável via `CHECKOV_IMAGE`)*

### Integrações Reais (Fase 6) — ver `docs/PHASE6_INTEGRATIONS.md`
- [x] Redis/BullMQ para fila distribuída (driver plugável, ativado por `REDIS_URL`).
- [x] FinOps com dados reais da AWS Cost Explorer API (rotulado por `source`).
- [x] Drift detection real (`terraform plan --refresh-only`, cron + sob demanda).
- [x] GitHub App publica Check Run na PR (status que bloqueia merge).
- [ ] Provisionar Redis + workers dedicados e publicar o GitHub App em produção.

### Fila, E2E e regressões (Fase 8) — ver `docs/PHASE8_QUEUE_E2E.md`
- [x] Driver BullMQ endurecido (conexão ioredis correta, shutdown gracioso, observabilidade).
- [x] Runner do Checkov isolado também no fluxo de repositório (webhook de PR).
- [x] Teste de regressão da "tela preta" (resource/resourceId).
- [x] E2E do funil PLG com Playwright + job de CI.
- [x] E2E do fluxo core autenticado (Login → Scan → Auto-Fix), Firebase/DB mockados.
- [x] Correção de 2º crash de boot: cliente Gemini agora é lazy (chave opcional).
- [x] Frontend migrado do Tailwind CDN para Tailwind compilado (PostCSS/Vite).

### Pré-deploy / Contêiner (Fase 9) — ver `docs/PHASE9_PREDEPLOY.md`
- [x] Dockerfile corrigido (build funcionava não; roda o bundle, não-root, healthcheck, Chromium).
- [x] Teste de integração de TODAS as rotas contra Postgres real + job de CI dedicado.
- [x] Bug corrigido: criação de política bloqueada sem OPA (agora degrada).
- [x] Bug corrigido: auto-remediação com semântica de erro clara (503/400/502, não 500).
- [x] Workflow de build & push da imagem para o GHCR (`.github/workflows/docker.yml`) — ver `docs/DEPLOY.md`.
- [ ] Provisionar serviços externos (Postgres gerenciado, Redis, GitHub App, AWS) e apontar o deploy.

### Produto (Fase 4)
- [x] Webhook Stripe com verificação de assinatura + persistência de `Tenant.plan`.
- [x] Enforcement de limites por plano (projetos por tier).
- [x] Esqueleto de auto-remediação (PR automático de fix via Octokit).

### PLG — Auditoria de 5 Minutos (Fase 7) — ver `docs/PHASE7_PLG.md`
- [x] Endpoint público `POST /api/v1/audit/instant` (motor nativo + score + captura de lead).
- [x] Relatório executivo em PDF por token; `reportService` sem custo mockado.
- [x] Seção "Auditoria grátis" na LandingPage (interativa, consumindo o endpoint).
- [x] Nurturing por email do lead (`leadNurturingService`): relatório imediato +
  follow-up D+3 via cron; degrada sem SMTP; integrado ao `notificationService`.
- [x] Conversão lead → tenant: `provisionUser` marca `convertedTenantId` no
  Lead/InstantAudit quando o email do lead cria conta (atribuição do funil).
- [x] Testes E2E (Playwright) do funil e do fluxo Login → Scan → Fix (ver Fase 8).

## ⚠️ Pendências de deploy
- Rodar migração do Prisma (novos campos: `Tenant.plan`, `BudgetAlert.createdAt`;
  `tenantId` obrigatório em `User`/`Project`; `Lead.nurtureStage`/`lastEmailAt`/
  `convertedTenantId`; índices novos).
- Variáveis obrigatórias em produção: `DATABASE_URL`, `AWS_REGION`, `AWS_KMS_KEY_ID`,
  `STRIPE_WEBHOOK_SECRET` (se billing ativo). Ver `.env.example`.
- Para o nurturing PLG: `EMAIL_*` (SMTP) e `PUBLIC_BASE_URL` (links absolutos nos emails).
