# 🗺️ CloudGuardian: Roadmap para Produção (Zero-to-Hero)

## 📦 FASE 1: FRONTEND & UX (Status: 95% CONCLUÍDO)
- [x] **Core UI/Layout**: `Sidebar.tsx`, `Header.tsx`, `App.tsx` (Navegação fluida e responsiva).
- [x] **Dashboard HUD**: `Dashboard.tsx` (Globo 3D, Gráficos Recharts, Animações CSS).
- [x] **IA Integration**: `geminiService.ts`, `AIAssistant.tsx`, `LiveAssistant.tsx` (Conectado à API Google).
- [x] **Scanner UI**: `Scanner.tsx`, `ScanResults.tsx`, `DiffViewer.tsx` (Visualização de código e diffs).
- [x] **Visualização de Grafo**: `Graph.tsx` (Force-graph simulado com nós e arestas).
- [x] **War Room**: `WarRoom.tsx` (Interface de resposta a incidentes e logs táticos).
- [ ] **State Management**: Migrar de `useState` local para **TanStack Query** (Cache/Sync com Backend).
- [ ] **Testes E2E**: Implementar **Cypress** para validar fluxos críticos (Login -> Scan -> Fix).

## ⚙️ FASE 2: BACKEND API & DATABASE (Status: 0% - CRÍTICO)
- [ ] **API Gateway**: Criar `/backend/server.ts` (Node.js/Express ou NestJS) para substituir `services/backend.ts`.
- [ ] **Database Real**: Substituir `localStorage` (`dbService.ts`) por **PostgreSQL + Prisma ORM**.
- [ ] **Autenticação**: Substituir Mock Login (`Login.tsx`) por **Clerk Auth** ou **Auth0** com JWT real.
- [ ] **Filas de Processamento**: Implementar **BullMQ/Redis** para scans demorados (Terraform plans).
- [ ] **Secure Vault**: Integração com **HashiCorp Vault** ou **AWS Secrets Manager** para guardar chaves de API dos clientes.

## 🛠️ FASE 3: ENGINE DE SEGURANÇA (Status: 10% - Lógica Simulada)
- [ ] **Terraform Runner**: Container Docker epímero para rodar `terraform plan` real no backend.
- [ ] **Static Analysis**: Integrar binário do **Checkov** ou **TFLint** no pipeline de análise do backend.
- [ ] **Drift Detection**: Criar Cron Job que roda `terraform plan --refresh-only` contra AWS/Azure reais.
- [ ] **GitHub App**: Criar App no GitHub para receber Webhooks reais (substituir `PipelineInsights.tsx` simulado).
- [ ] **FinOps Engine**: Conectar à **AWS Cost Explorer API** para popular `FinOps.tsx` com dados reais.

## 🚀 FASE 4: INFRAESTRUTURA & DEPLOY (Status: 0%)
- [ ] **Dockerização**: Criar `Dockerfile` e `docker-compose.yml` para rodar Frontend + Backend + DB.
- [ ] **CI/CD Próprio**: Configurar GitHub Actions para deploy automático do CloudGuardian na Vercel/AWS.
- [ ] **Monitoramento**: Adicionar **Sentry** (Erros) e **PostHog** (Analytics de uso) no `App.tsx`.
- [ ] **Billing**: Integrar **Stripe** para processar pagamentos das tiers (Starter/Pro/Business).

## 📂 ESTRUTURA DE MIGRAÇÃO DE ARQUIVOS
1. `services/backend.ts` -> Deletar. Substituir por chamadas `axios.get('/api/...')`.
2. `services/dbService.ts` -> Deletar. O estado deve vir do React Query.
3. `types.ts` -> Compartilhar via Monorepo ou gerar via OpenAPI do Backend.
4. `pages/*` -> Manter visual, mas conectar os `useEffect` aos hooks da API real.
