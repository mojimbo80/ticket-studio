import { logger } from './logger';
import { prisma } from './prisma';

export async function isDatabaseReachable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.warn({ err: error }, 'Base de données injoignable');
    return false;
  }
}
