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
- [ ] Runner de Checkov em container Docker efêmero (hoje roda no host com fallback simulado).
- [ ] Redis/BullMQ para fila distribuída (hoje a fila é em memória — perde jobs em restart).

### Produto (Fase 4)
- [x] Webhook Stripe com verificação de assinatura + persistência de `Tenant.plan`.
- [x] Enforcement de limites por plano (projetos por tier).
- [x] Esqueleto de auto-remediação (PR automático de fix via Octokit).
- [ ] Auditoria de 5 minutos (PLG): conectar repo → PDF executivo, polido ponta a ponta.
- [ ] Drift detection real (`terraform plan --refresh-only` agendado contra as clouds).
- [ ] FinOps com dados reais da AWS Cost Explorer API.
- [ ] Testes E2E (Playwright/Cypress) do fluxo Login → Scan → Fix.

## ⚠️ Pendências de deploy
- Rodar migração do Prisma (novos campos: `Tenant.plan`, `BudgetAlert.createdAt`;
  `tenantId` obrigatório em `User`/`Project`; índices novos).
- Variáveis obrigatórias em produção: `DATABASE_URL`, `AWS_REGION`, `AWS_KMS_KEY_ID`,
  `STRIPE_WEBHOOK_SECRET` (se billing ativo). Ver `.env.example`.
