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

## Próximos passos (produto)

- Frontend: seção "Auditoria grátis" na `LandingPage` consumindo o endpoint.
- Sequência de nurturing por email para o lead capturado (integrar ao
  `notificationService`).
- Conversão lead → tenant (o campo `InstantAudit.convertedTenantId` já existe).
- Testes E2E (Playwright) do funil: colar Terraform → ver score → baixar PDF.
