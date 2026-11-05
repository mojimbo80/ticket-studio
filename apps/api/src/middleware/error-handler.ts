import { ErrorResponseSchema } from '@ticket-studio/shared';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/app-error';
import { logger } from '../lib/logger';

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new AppError(404, 'Route introuvable'));
};

// Express 5 transmet automatiquement à ce gestionnaire les erreurs des fonctions async.
export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json(
      ErrorResponseSchema.parse({
        message: 'Requête invalide',
        issues: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      }),
    );
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json(ErrorResponseSchema.parse({ message: error.message }));
    return;
  }

  logger.error({ err: error, method: req.method, url: req.url }, 'Erreur non gérée');
  res.status(500).json(ErrorResponseSchema.parse({ message: 'Une erreur interne est survenue' }));
};
