# Fase 6 — Integrações Reais

Depois da Fase 5 (motor de detecção honesto), esta fase conecta o produto ao
mundo real: fila distribuída, custos reais da AWS, drift real de infraestrutura
e status de verificação de verdade nas PRs. O princípio segue o mesmo: **código
de produção que ativa com configuração real e se rotula honestamente quando não
há serviço externo** — nunca fabrica dado.

## 6.1 Fila distribuída (BullMQ/Redis)

`services/queue/` define uma abstração `QueueDriver` com dois drivers:

- **`InMemoryQueueDriver`** (padrão): processa em processo único; perde jobs em
  restart. Bom para dev e deploy single-node.
- **`BullMqQueueDriver`**: ativado por `REDIS_URL`. Persiste jobs no Redis,
  sobrevive a restart, permite múltiplos workers e faz retry com backoff
  exponencial. O import do BullMQ é dinâmico — o caminho in-memory nunca
  carrega Redis.

A API pública do `queueService` (`addScanJob`, `addContentScanJob`,
`addReportJob`) não mudou; só o transporte por baixo.

## 6.2 FinOps real (AWS Cost Explorer)

`services/costExplorerService.ts` busca o custo month-to-date real da conta AWS
(`GetCostAndUsage` por serviço + `GetCostForecast` para projeção). Sem
credenciais, `isConfigured()` é `false` e o método **lança** em vez de inventar
número.

`finOpsService.analyzeTenant` usa o custo real quando disponível e cai para a
estimativa por rulepack de preços caso contrário. Toda análise grava o campo
`source` (`aws-cost-explorer` | `estimate`), exposto no dashboard para o front
rotular — o usuário sempre sabe se está vendo custo real ou estimativa.

## 6.3 Drift detection real (terraform plan -refresh-only)

`services/driftService.ts` clona o repositório do projeto, roda
`terraform init` + `plan -refresh-only` + `show -json` e persiste as
divergências entre o estado registrado e o mundo real. `services/driftParser.ts`
isola o parser puro (testável sem terraform/banco).

- Modelo `Drift` no schema (recurso, tipo, before/after, severidade, `source`).
- `routes/drifts.ts` retorna drift **real** do banco quando existe; se não há
  nenhum, devolve uma visão **derivada** das vulnerabilidades abertas, sempre
  com `source` (`terraform-refresh` | `derived`) — a UI nunca apresenta a visão
  derivada como drift real de infraestrutura.
- Cron diário (03:00) que só roda se o terraform estiver presente no runner.
- `POST /drifts/detect` dispara a detecção sob demanda por projeto.

Sem terraform disponível, o serviço lança e o endpoint responde `503` —
honestidade em vez de dado falso.

## 6.4 GitHub App: Check Runs

Antes, o resultado do scan de PR virava um comentário solto. Agora
`services/githubAppService.ts` publica um **Check Run** — um status de
verificação que pode **bloquear o merge**:

- `buildCheckRunPayload` (função pura, testada) mapeia as vulnerabilidades para
  anotações inline por arquivo/linha; `conclusion = failure` quando há qualquer
  violação crítica/alta. Respeita o limite de 50 anotações do GitHub e resume o
  excedente.
- `postCheckRun` usa o token de instalação do App; `isConfigured()` é o gate.

## Pendências para produção

- **Provisionar Redis** e rodar workers dedicados com `REDIS_URL`.
- **Publicar e instalar o GitHub App** (App ID + private key + webhook secret) e
  validar o Check Run numa PR real.
- **Credenciais de cloud + terraform** no runner de drift; hoje o drift real só
  roda onde esses pré-requisitos existem.
- **Migração do banco**: novos campos/modelos (`Drift`, `CostAnalysis.source`,
  `Scan.engine`).
