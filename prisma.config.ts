import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Config do Prisma 7. O runtime da aplicação usa o adapter PrismaPg
 * (services/db.ts), mas os comandos de migração/introspecção
 * (`prisma db push`, `prisma migrate`, `prisma db seed`) precisam da url do
 * datasource declarada aqui — não mais no schema.prisma.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
