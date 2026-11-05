import { createApp } from './app';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { syncRepo } from './repo/sync';

const PORT = 3000;

const server = createApp().listen(PORT, () => {
  logger.info(`API à l'écoute sur http://localhost:${PORT}`);
});

// Clone ou mise à jour du dépôt en arrière-plan : l'API répond même si git échoue.
syncRepo().catch(() => {
  logger.warn("Le dépôt n'a pas pu être synchronisé au démarrage");
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`Arrêt de l'API (${signal})`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
