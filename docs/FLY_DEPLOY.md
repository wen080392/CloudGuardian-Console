# Deploy no Fly.io

Deploy do CloudGuardian usando a imagem publicada no GHCR
(`ghcr.io/wen080392/cloudguardian-console`). O manifesto é o `fly.toml` na raiz.

> **Pré-requisito:** `flyctl` instalado (`curl -L https://fly.io/install.sh | sh`)
> e logado (`fly auth login`).

## 1. A imagem do GHCR precisa estar acessível ao Fly

A imagem é **privada por padrão**. Escolha um caminho:

**A) Tornar o package público (mais simples)** — em
`github.com/users/wen080392/packages/container/cloudguardian-console/settings`
→ *Change visibility* → **Public**. Aí o `fly deploy` puxa direto.

**B) Manter privado — re-tag para o registry do Fly:**

```bash
fly auth docker                                    # configura credenciais do registry.fly.io
echo "$GHCR_TOKEN" | docker login ghcr.io -u wen080392 --password-stdin
docker pull ghcr.io/wen080392/cloudguardian-console:latest
docker tag  ghcr.io/wen080392/cloudguardian-console:latest \
            registry.fly.io/cloudguardian-console:latest
docker push registry.fly.io/cloudguardian-console:latest
# e troque a linha `image = ...` do fly.toml para registry.fly.io/...
```

## 2. Criar o app

```bash
fly launch --no-deploy --copy-config --name cloudguardian-console --region gru
```

`--no-deploy` cria o app sem subir ainda (faltam os secrets). `--copy-config`
usa o `fly.toml` existente. Ajuste `--name`/`--region` se quiser.

## 3. Provisionar Postgres e Redis (gerenciados pelo Fly)

```bash
# Postgres — o attach injeta DATABASE_URL como secret automaticamente
fly postgres create --name cloudguardian-db --region gru
fly postgres attach cloudguardian-db --app cloudguardian-console

# Redis (Upstash via Fly) — copie a URL que ele imprime para o secret abaixo
fly redis create
```

## 4. Secrets (obrigatórios e opcionais)

```bash
# Obrigatórios em produção (DATABASE_URL já veio do attach do Postgres)
fly secrets set \
  AWS_REGION=us-east-1 \
  AWS_KMS_KEY_ID=arn:aws:kms:us-east-1:...:key/... \
  AWS_ACCESS_KEY_ID=... \
  AWS_SECRET_ACCESS_KEY=...

# Fila distribuída (recomendado) — URL vinda do `fly redis create`
fly secrets set REDIS_URL=redis://default:...@fly-...upstash.io:6379

# Opcionais (a feature degrada sem eles): Stripe, GitHub App, Gemini, SMTP...
fly secrets set STRIPE_SECRET_KEY=sk_live_... STRIPE_WEBHOOK_SECRET=whsec_...
```

Secrets ficam disponíveis também na VM do `release_command`, então a migração
enxerga `DATABASE_URL`.

## 5. Deploy

```bash
fly deploy
```

O que acontece: Fly puxa a imagem → roda `npx prisma db push`
(`release_command`, migração 1x) → sobe as máquinas com estratégia rolling →
passa a rotear quando o healthcheck em `GET /ping` responde.

## 6. Verificar

```bash
fly status
fly logs
curl -fsS https://cloudguardian-console.fly.dev/ping   # -> pong
fly open                                                # abre no navegador
```

## Notas de produção

- **Fixe a imagem por tag imutável** (`:sha-66de9a9` ou `:vX.Y.Z`) no `fly.toml`,
  não `:latest` — deploys reproduzíveis.
- **Memória:** 1 GB no `[[vm]]` por causa do Chromium (PDF via puppeteer);
  512 MB tende a dar OOM na geração de relatório.
- **HA:** `fly scale count 2` (ou mais) — o Postgres e o Redis já sobrevivem a
  restart; o app é stateless (uploads locais são fallback; prefira S3 via
  `S3_BUCKET`).
- **Checkov isolado:** o runner `docker` não roda dentro da VM do Fly; em
  produção no Fly, deixe `SCAN_RUNNER=auto` (engine nativo) ou aponte um runner
  externo.
- **CD:** para deploy automático a cada push na `main`, adicione um job com
  `superfly/flyctl-actions` usando `FLY_API_TOKEN` (`fly tokens create deploy`)
  como secret do repositório.

Referência geral de imagem/variáveis: `docs/DEPLOY.md` e `docs/GO_LIVE.md`.
