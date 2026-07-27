# ---- Stage 1: Build Frontend & Prisma ----
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências (incluindo devDependencies para o Vite)
COPY package.json package-lock.json ./
RUN npm ci

# Copiar todo o código fonte
COPY . .

# Gerar Prisma Client (O container Linux vai compilar a engine correta)
RUN npx prisma generate

# Buildar o frontend (Gera a pasta /dist)
RUN npm run build

# ---- Stage 2: Production Runner ----
FROM node:20-alpine AS runner

WORKDIR /app

# Copiar package.json e instalar apenas dependências de produção
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# O tsx é necessário para rodar o backend em TypeScript diretamente
RUN npm install tsx --no-save

# Copiar os artefatos construídos
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copiar o código do backend
COPY server.ts ./
COPY routes/ ./routes/
COPY services/ ./services/
COPY middleware/ ./middleware/
COPY prisma/ ./prisma/

# Criar diretório para relatórios locais (fallback)
RUN mkdir -p ./uploads/reports

# Variáveis de ambiente padrão para produção
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Iniciar o servidor usando TSX
CMD ["npx", "tsx", "server.ts"]
