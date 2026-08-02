# Go-Live — subir a imagem do CloudGuardian

A imagem de produção é buildada e publicada pela CI no GHCR a cada push na
`main` (workflow `.github/workflows/docker.yml`):

```
ghcr.io/wen080392/cloudguardian-console:latest
```

> **Onde rodar:** qualquer host com acesso de rede a registries de contêiner
> (sua máquina, uma VM, ECS/Fly/Render/K8s). Ambientes com egress restrito a
> registries de pacotes (npm/pypi) **não** conseguem baixar camadas de imagem.

## Opção A — stack completo com docker-compose (mais rápido)

```bash
# 1. Segredos
cp .env.example .env
$EDITOR .env                 # preencha DATABASE_URL, AWS_REGION, AWS_KMS_KEY_ID, etc.

# 2. Autenticar no GHCR (imagem é privada por padrão)
#    Token precisa do escopo read:packages.
echo "$GHCR_TOKEN" | docker login ghcr.io -u <seu-usuario> --password-stdin

# 3. Migração do banco (roda uma vez e sai)
docker compose -f docker-compose.prod.yml run --rm migrate

# 4. Subir app + Postgres + Redis
docker compose -f docker-compose.prod.yml up -d

# 5. Smoke test
curl -fsS http://localhost:3000/ping        # deve responder 200
docker compose -f docker-compose.prod.yml logs -f app
```

## Opção B — só o contêiner (Postgres/Redis gerenciados)

```bash
docker login ghcr.io -u <seu-usuario>        # se a imagem for privada

# Migração (aponte para o seu Postgres gerenciado)
docker run --rm --env-file .env \
  ghcr.io/wen080392/cloudguardian-console:latest \
  npx prisma db push

# App
docker run -d --name cloudguardian -p 3000:3000 --env-file .env \
  --restart unless-stopped \
  ghcr.io/wen080392/cloudguardian-console:latest

curl -fsS http://localhost:3000/ping
```

## Variáveis de ambiente

Ver `.env.example`. **Obrigatórias em produção:**

| Var | Para quê |
|-----|----------|
| `DATABASE_URL` | Postgres (use o `sslmode` do provedor) |
| `AWS_REGION` + `AWS_KMS_KEY_ID` | criptografia fail-closed das credenciais |

**Opcionais** (a feature degrada graciosamente sem elas): `REDIS_URL`,
`STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`, `GITHUB_APP_ID` +
`GITHUB_PRIVATE_KEY_PATH` + `GITHUB_WEBHOOK_SECRET`, `GITHUB_TOKEN`,
`SCAN_RUNNER=docker` + `CHECKOV_IMAGE`, `OPA_PATH`, `SENTRY_DSN`,
`GEMINI_API_KEY`.

## Checklist de produção

- [ ] `.env` preenchido; **nenhum** segredo commitado.
- [ ] `AWS_KMS_KEY_ID` presente (sem ela, o boot em produção falha de propósito — fail-closed).
- [ ] Migração aplicada **antes** do primeiro boot (`prisma db push` ou `prisma migrate deploy`).
- [ ] `GET /ping` retorna 200 (é o alvo do HEALTHCHECK).
- [ ] Em produção, **fixe o Checkov por digest** (`CHECKOV_IMAGE=...@sha256:...`).
- [ ] Imagem versionada por tag imutável (`:sha-<curto>` ou `:vX.Y.Z`), não só `:latest`.
- [ ] TLS/terminação na frente (reverse proxy/load balancer); o app escuta `:3000` em HTTP.

## Notas da imagem

- Roda o backend **bundlado** (`node dist/server.cjs`), usuário **não-root**.
- **HEALTHCHECK** no `/ping`; **Chromium** embutido (PDF via puppeteer).
- Não migra no start (evita corrida entre réplicas) — a migração é passo à parte.

Referência completa de CI/CD e da imagem: `docs/DEPLOY.md`.
