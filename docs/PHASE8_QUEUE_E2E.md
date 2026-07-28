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

Rodam via `npm run test:e2e`; a config aponta para um Chromium pré-instalado
quando disponível e, em CI, o job `e2e` roda `playwright install chromium`.
Nenhum teste precisa de backend/DB — as APIs são interceptadas.

**`e2e/instantAudit.spec.ts` — funil PLG (público):** colar Terraform → rodar →
ver score/severidades/regras → link do PDF; e a validação de email obrigatório.

**`e2e/authenticatedFlow.spec.ts` — fluxo core (Login → Scan → Auto-Fix):**
Firebase e o banco são "mockados" sem infra externa:
- **Auth**: o teste semeia `localStorage['user_data']` antes do load. O
  `AuthProvider` inicializa `user` a partir daí e `isAuthenticated = !!user`,
  então o console autenticado renderiza **sem tocar no Firebase**.
- **API/DB**: todas as chamadas `/api/v1/**` são interceptadas (catch-all vazio
  + um mock específico para `POST /scans`).

O teste carrega o console autenticado (sem passar pela LandingPage), navega ao
Scanner, roda o scan, vê as vulnerabilidades e dispara o Auto-Fix até o
DiffViewer da IA. É exatamente o caminho que blinda as integrações vitais
contra regressões — o crash `resource/resourceId` teria sido pego aqui.

### Segundo bug de tela branca encontrado (independente do reportado)

Rodar o E2E expôs outro crash de boot: `services/backend.ts` instanciava
`new GoogleGenAI({ apiKey })` **no topo do módulo**. Com `VITE_GEMINI_API_KEY`
vazia (a chave é **opcional**), o construtor **lança** e derruba a app inteira
em tela branca — antes até do ErrorBoundary. Corrigido com **inicialização
lazy** (`getAI()`): o cliente só é construído quando há chave e sob demanda; sem
chave, a IA degrada graciosamente ("IA indisponível") em vez de quebrar a app.

## 8.4 Tailwind compilado (fim da dependência de CDN)

O frontend dependia do **Tailwind Play CDN** (`<script src="cdn.tailwindcss.com">`)
em runtime — em rede bloqueada/CSP restrita, o CDN falhava e a UI ficava sem
estilo. Migrado para Tailwind compilado via PostCSS/Vite:

- `tailwind.config.js` com a paleta e animações exatas do config inline (mais
  `primary-700/900`, que o código usava mas o config do CDN não definia — eram
  no-ops silenciosos; agora funcionam com a escala azul padrão).
- `postcss.config.js` (tailwindcss + autoprefixer) e `index.css` com as
  diretivas `@tailwind` + os estilos globais (`.glass`, `.neo-card`, scrollbar).
- `index.html` sem CDN, config inline nem `<style>`; `index.tsx` importa o CSS.
- O build agora emite um asset CSS (~71 KB, purgado) — antes não havia CSS
  algum no bundle, pois o Tailwind era 100% runtime.

Verificado no browser (app buildada, sem CDN): renderiza totalmente estilizada,
sem o erro `tailwind is not defined`.
