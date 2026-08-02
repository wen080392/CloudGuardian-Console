# Deploy — imagem Docker e passos de produção

## CI/CD

Três workflows em `.github/workflows/`:

- **`ci.yml`** — em todo PR/push: `verify` (lint + testes unit + build),
  `integration` (todas as rotas contra Postgres real) e `e2e` (Playwright).
- **`docker.yml`** — build & push da imagem para o GHCR:
  - em **PR**: apenas **builda** a imagem (valida o Dockerfile ponta a ponta);
  - em push na **main**/tags `v*`: **builda e faz push** para
    `ghcr.io/wen080392/cloudguardian-console` (tags `latest`, `main`, `sha`,
    e semver nas tags).

## Rodar a imagem

```bash
docker pull ghcr.io/wen080392/cloudguardian-console:latest
docker run --rm -p 3000:3000 --env-file .env \
  ghcr.io/wen080392/cloudguardian-console:latest
```

Ou o stack completo (app + Postgres + Redis). Para **produção**, use a imagem
já publicada no GHCR via `docker-compose.prod.yml` (não builda do fonte):

```bash
cp .env.example .env   # preencha os segredos
docker compose -f docker-compose.prod.yml run --rm migrate   # migração (1x)
docker compose -f docker-compose.prod.yml up -d
```

Para **desenvolvimento** (builda do fonte local), use o `docker-compose.yml`:

```bash
docker compose up -d --build
```

> Passo a passo completo de go-live (auth GHCR, smoke test, checklist): `docs/GO_LIVE.md`.

## Migração do banco (obrigatória antes do primeiro boot)

O contêiner **não** roda migrações no start (evita corrida com múltiplas
réplicas). Rode como passo separado do deploy:

```bash
DATABASE_URL=... npx prisma db push        # ou: npx prisma migrate deploy
```

## Variáveis de ambiente

Ver `.env.example`. Obrigatórias em produção:

- `DATABASE_URL` (Postgres; use o `sslmode` do seu provedor)
- `AWS_REGION` + `AWS_KMS_KEY_ID` (criptografia fail-closed de credenciais)

Opcionais (a feature degrada graciosamente sem elas):

- `REDIS_URL` (fila distribuída; sem ela, fila in-memory)
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (billing)
- `GITHUB_APP_ID` + `GITHUB_PRIVATE_KEY_PATH` + `GITHUB_WEBHOOK_SECRET` (Check Runs)
- `GITHUB_TOKEN` (auto-remediação via PR)
- `SCAN_RUNNER=docker` + `CHECKOV_IMAGE` (Checkov isolado; senão engine nativo)
- `OPA_PATH` (validação de política; sem OPA, salva sem validação de sintaxe)
- `SENTRY_DSN` (observabilidade de erros)
- `GEMINI_API_KEY` / `VITE_GEMINI_API_KEY` (assistente de IA)

## Notas da imagem

- Roda o backend **bundlado** (`node dist/server.cjs`), não `tsx`.
- Usuário **não-root**, **HEALTHCHECK** no `/ping`.
- **Chromium** incluído (geração de PDF via puppeteer).
- Em produção, **fixe a imagem do Checkov por digest** (`CHECKOV_IMAGE`).
