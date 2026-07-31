# ---- Stage 1: Build (frontend + bundle do backend + Prisma Client) ----
FROM node:22-alpine AS builder

WORKDIR /app

# Dependências completas (inclui devDependencies para Vite/esbuild/prisma CLI).
# --ignore-scripts: o postinstall (prisma generate) precisa do schema, que
# ainda não foi copiado aqui — geramos o client explicitamente após o COPY.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Código-fonte e geração do Prisma Client (agora com o schema presente)
COPY . .
RUN npx prisma generate
# Gera dist/ (frontend) e dist/server.cjs (backend bundlado, packages external)
RUN npm run build

# ---- Stage 2: Runner (produção) ----
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Chromium para a geração de PDF (puppeteer) — a imagem alpine não traz o
# browser embutido; apontamos o puppeteer para o pacote do sistema.
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Dependências de produção. --ignore-scripts evita o postinstall
# (prisma generate) — o prisma CLI é devDep e o client gerado vem do builder.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Artefatos buildados + Prisma Client já gerado no builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# Schema + config para rodar migrações a partir do contêiner, se preciso
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Diretório de uploads (fallback local de relatórios) + permissões não-root
RUN mkdir -p ./uploads/reports && chown -R node:node /app

USER node
EXPOSE 3000

# Healthcheck bate no /ping (endpoint leve, sem auth)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --spider http://localhost:3000/ping || exit 1

# Roda o backend BUNDLADO (não re-transpila TS em runtime)
CMD ["node", "dist/server.cjs"]
