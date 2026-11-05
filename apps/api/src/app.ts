import cors from 'cors';
import express from 'express';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './lib/logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { analyzeRouter } from './routes/analyze';
import { healthRouter } from './routes/health';
import { projectRouter } from './routes/project';

export function createApp(): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(pinoHttp({ logger }));
  app.use(cors({ origin: env.WEB_ORIGIN }));
  app.use(express.json());

  app.use('/api', healthRouter);
  app.use('/api', projectRouter);
  app.use('/api', analyzeRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
