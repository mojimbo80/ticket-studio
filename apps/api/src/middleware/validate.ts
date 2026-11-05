import type { RequestHandler, Response } from 'express';
import type { ZodType } from 'zod';

interface RequestSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export interface ValidatedRequest {
  body: unknown;
  query: unknown;
  params: unknown;
}

// Valide body, query et params ; les valeurs parsées sont disponibles via getValidatedRequest.
// Une erreur de validation est transmise au gestionnaire d'erreurs central (réponse 400).
export function validate(schemas: RequestSchemas): RequestHandler {
  return (req, res, next) => {
    try {
      const validated: ValidatedRequest = {
        body: schemas.body ? schemas.body.parse(req.body) : req.body,
        query: schemas.query ? schemas.query.parse(req.query) : req.query,
        params: schemas.params ? schemas.params.parse(req.params) : req.params,
      };
      res.locals.validated = validated;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function getValidatedRequest(res: Response): ValidatedRequest {
  return res.locals.validated as ValidatedRequest;
}
