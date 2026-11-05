import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { defineConfig, env } from 'prisma/config';

// Le fichier .env est à la racine du monorepo, partagé par l'API et le front.
config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
