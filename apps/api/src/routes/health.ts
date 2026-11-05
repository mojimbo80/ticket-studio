import { HealthResponseSchema } from '@ticket-studio/shared';
import { Router } from 'express';
import { isDatabaseReachable } from '../lib/database';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  const databaseReachable = await isDatabaseReachable();
  const body = HealthResponseSchema.parse({
    status: databaseReachable ? 'ok' : 'error',
    database: databaseReachable ? 'ok' : 'error',
  });

  res.status(databaseReachable ? 200 : 503).json(body);
});
