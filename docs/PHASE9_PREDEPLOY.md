# Fase 9 — Pré-deploy: prontidão de contêiner e teste de todas as rotas

Pass de engenheiro sênior antes de subir para o contêiner: revisão do
Dockerfile, teste de **todas as rotas** contra Postgres real, e correção do
que apareceu.

## 9.1 Dockerfile — problemas reais corrigidos

O Dockerfile anterior tinha três defeitos que impediam/degradavam o deploy:

1. **Build quebrava**: `npm ci --omit=dev` disparava o `postinstall`
   (`prisma generate`), mas o `prisma` CLI é devDependency (omitido) →
   `prisma: command not found` → falha. Corrigido com `--ignore-scripts`
   (o client gerado vem do estágio builder).
2. **Rodava `tsx server.ts` em produção** — re-transpilava TypeScript no boot
   e ignorava o bundle. Agora roda `node dist/server.cjs` (backend bundlado).
3. **PDF (puppeteer) não funcionaria** — a imagem alpine não traz Chromium.
   Agora instala `chromium` e aponta `PUPPETEER_EXECUTABLE_PATH`.

Também: usuário **não-root** (`USER node`), **HEALTHCHECK** no `/ping`, e cópia
do `prisma.config.ts` (para migrações a partir do contêiner). Verificado que
todas as libs de runtime estão em `dependencies` (o bundle é `--packages=external`).

## 9.2 Teste de todas as rotas (servidor real)

Servidor buildado (`node dist/server.cjs`, igual ao contêiner) contra Postgres
real: `/ping` 200, `/api/health` 200, rotas protegidas sem token → 401, funil
público grava no banco, path traversal bloqueado, SPA servida em `/`.

## 9.3 Integração — todas as rotas com auth injetado (`tests/integration/`)

`tests/integration/routes.integration.test.ts` monta todos os routers com um
`req.user` injetado (bypass do Firebase) contra Postgres real e bate em cada
endpoint (GET/POST/PATCH/PUT/DELETE), afirmando que **nenhuma rota responde 500
por bug** — todas retornam status tratado. Gated por `RUN_DB_TESTS`; um job de
CI dedicado sobe Postgres como service e roda a suíte.

### Dois bugs reais encontrados e corrigidos

1. **Criação de política bloqueada sem OPA** (`opaEngine.validatePolicy`): a
   detecção de "binário ausente" só olhava `error.code === 'ENOENT'`, mas via
   shell o OPA ausente vem como exit 127 + "not found" → caía em
   `valid: false` → **400 bloqueava criar qualquer política** onde o OPA não
   está instalado. Corrigido: detecção robusta (ENOENT/127/"not found") + degrada
   graciosamente (salva sem validação de sintaxe) + `execFile` sem shell.
2. **Auto-remediação retornava 500 opaco**: qualquer falha do GitHub (repo
   inexistente, permissão, rede) virava um 500. Agora tem semântica clara:
   `503` (não configurado), `400` (URL inválida), `502` (falha de upstream no
   GitHub) — não mais um 500 genérico.

## Prontidão para o contêiner — resumo

- ✅ Dockerfile corrigido (build funciona, roda o bundle, não-root, healthcheck, Chromium).
- ✅ `node dist/server.cjs` sobe contra Postgres real e serve UI + API.
- ✅ Todas as rotas respondem status tratado (nenhum 500 por bug).
- ✅ Rotas com dependência externa degradam corretamente (OPA/terraform/GitHub/Checkov).
- ⚠️ Falta apenas provisionar: build/push da imagem num registry, e as
  variáveis/serviços externos (Postgres gerenciado, Redis, GitHub App, AWS).
