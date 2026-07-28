# Fase 8 — Fila endurecida, E2E e regressões

## 8.1 Driver BullMQ endurecido

Revisão do driver Redis/BullMQ (introduzido na Fase 6) corrigiu um bug real e
somou robustez:

- **Conexão ioredis correta**: a versão anterior passava `{ url }` como
  connection — **não é opção válida do ioredis**, que ignoraria a URL e
  conectaria em `localhost:6379`. Agora instanciamos `new IORedis(url, {...})`
  com **`maxRetriesPerRequest: null`** (exigência das conexões bloqueantes do
  BullMQ — Worker/QueueEvents) e conexões dedicadas por componente (`duplicate()`).
- **Shutdown gracioso**: `close()` encerra worker, fila, QueueEvents e a
  conexão; ligado a `SIGTERM`/`SIGINT` no `server.ts` (drena a fila antes de sair).
- **Observabilidade**: listeners de `failed`/`error` no worker e na conexão.
- `ioredis` virou dependência explícita (era só transitiva via bullmq).
- Testado com ioredis/bullmq mockados (`tests/bullmqDriver.test.ts`) — valida a
  conexão correta, retry/backoff e o `close()`, sem Redis real.

## 8.2 Regressão da "tela preta"

`tests/scanResultsRegression.test.tsx` reproduz o crash que corrigimos: uma
vulnerabilidade com `resource` ausente (o banco usa `resourceId`) fazia
`f.resource.split('.')` lançar e derrubar o React. O teste dirige o fluxo real
de IA-fix no `ScanResults` com um finding sem `resource` e garante que o diff
renderiza sem crash. É o teste que teria pego o bug automaticamente.

## 8.3 E2E com Playwright

`e2e/instantAudit.spec.ts` valida o **funil PLG** ponta a ponta no browser
(Chromium), interceptando o endpoint público — **não precisa de backend/DB**:
colar Terraform → rodar → ver score/severidades/regras → link do PDF; e a
validação de email obrigatório. Rodam via `npm run test:e2e`; a config aponta
para um Chromium pré-instalado quando disponível e, em CI, o job
`e2e` roda `playwright install chromium`.

### Segundo bug de tela branca encontrado (independente do reportado)

Rodar o E2E expôs outro crash de boot: `services/backend.ts` instanciava
`new GoogleGenAI({ apiKey })` **no topo do módulo**. Com `VITE_GEMINI_API_KEY`
vazia (a chave é **opcional**), o construtor **lança** e derruba a app inteira
em tela branca — antes até do ErrorBoundary. Corrigido com **inicialização
lazy** (`getAI()`): o cliente só é construído quando há chave e sob demanda; sem
chave, a IA degrada graciosamente ("IA indisponível") em vez de quebrar a app.

## Pendência conhecida (produção)

O frontend depende do **Tailwind Play CDN** (script em `index.html`) em runtime.
Em ambientes com CSP restrita ou rede bloqueada, o CDN falha e a UI fica sem
estilo (o app renderiza, mas cru). Migrar para Tailwind compilado via
PostCSS/Vite é o próximo passo de robustez do frontend.
