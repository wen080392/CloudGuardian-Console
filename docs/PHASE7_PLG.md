# Fase 7 — Auditoria de 5 Minutos (PLG)

O plano de negócios define o motor de tração como Product-Led Growth: o lead
conecta seu Terraform e, em minutos, recebe um relatório executivo dos riscos —
convertendo a dor em ação. Esta fase implementa esse funil de ponta a ponta no
backend.

## Fluxo

1. **`POST /api/v1/audit/instant`** (público, sem conta): recebe
   `{ email, company?, terraform }`. Roda o **motor nativo** (não depende de
   Checkov nem de infra externa — ideal para um lead anônimo), calcula um
   **score de risco 0–100** e um resumo por severidade, **captura o lead** e
   persiste o resultado. Responde com o score, o top de findings e uma URL de
   download do PDF autenticada por token.

2. **`GET /api/v1/audit/instant/:id/report.pdf?token=...`**: gera o **relatório
   executivo em PDF** (reusa o `PDFGenerator` com gráfico de severidade), a peça
   que o lead leva para a diretoria. O token aleatório evita enumeração.

## Decisões de segurança

- **Só aceita Terraform colado**, não repositórios arbitrários: auditar um repo
  informado por um anônimo seria um vetor de SSRF/abuso. Auditar repositório
  exige conta + projeto (fluxo do webhook/scan autenticado).
- **Rate limit estrito** próprio: 5 auditorias por IP/hora, além do limitador
  global da API.
- **Validação zod** de email e tamanho do conteúdo (máx. 500 KB).
- O motor nativo é puro e não executa o IaC — apenas o parseia.

## Lógica pura e testável

`services/instantAuditScoring.ts` isola `summarize`, `riskScore` (determinístico)
e `topFindings` — sem Prisma, cobertos por `tests/instantAudit.test.ts`. O
`instantAuditService` orquestra a persistência (Lead + InstantAudit).

## Extra: relatório de compliance sem custo mockado

`reportService` gerava o PDF com `costAnalysis = { totalCost: 12000, savings: 350 }`
hardcoded. Agora lê a `CostAnalysis` real mais recente do tenant (0 quando não
há), no mesmo espírito das fases anteriores: nada de número fabricado.

## Nurturing por email do lead

`services/leadNurturingService.ts` fecha o loop do funil:

- **Email imediato** pós-auditoria: score, contagem por severidade, link
  absoluto do PDF (via `PUBLIC_BASE_URL`) e CTA de registro. Disparado pela
  rota em background — nunca atrasa nem derruba a resposta da auditoria.
- **Follow-up de conversão (D+3)**: cron diário (10:00, `schedulerService`)
  envia um único follow-up a leads que receberam o relatório há 3+ dias e não
  viraram cliente, e encerra a sequência.
- **Estado da sequência** em `Lead.nurtureStage` (0 capturado → 1 relatório
  enviado → 2 follow-up enviado) + `lastEmailAt`.
- **Transporte**: `NotificationService.sendDirectEmail` (novo método público
  reusando o SMTP `EMAIL_*`). Sem SMTP configurado, tudo é no-op — a auditoria
  continua funcionando.
- Conteúdo dos emails é gerado por funções puras (`buildReportEmail`,
  `buildFollowUpEmail`), cobertas por `tests/leadNurturing.test.ts`.

## Conversão lead → tenant

Quando um email que rodou a auditoria cria conta, `provisionUser` chama
`instantAuditService.markLeadConverted(email, tenantId)`: preenche
`convertedTenantId` no `Lead` e nos seus `InstantAudit` (atribuição do funil)
e tira o lead da sequência de nurturing. Best-effort: falha aqui nunca
impede login/registro. Cobre também o caminho de usuário pré-convidado.

## Próximos passos (produto)

- ~~Frontend: seção "Auditoria grátis" na `LandingPage`~~ ✔ feito.
- ~~Nurturing por email~~ ✔ feito (acima).
- ~~Conversão lead → tenant~~ ✔ feito (acima).
- ~~Testes E2E (Playwright) do funil~~ ✔ `e2e/instantAudit.spec.ts` (Fase 8).
- Dashboard de funil (leads, conversões, score médio) para o time comercial.
