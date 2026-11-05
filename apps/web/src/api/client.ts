import { ErrorResponseSchema } from '@ticket-studio/shared';
import type { z } from 'zod';

const API_BASE_PATH = '/api';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Seul point d'entrée HTTP du front : la réponse est validée par le schéma Zod fourni.
export async function apiGet<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(`${API_BASE_PATH}${path}`, {
    headers: { Accept: 'application/json' },
  });
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = ErrorResponseSchema.safeParse(payload);
    const message = error.success ? error.data.message : 'Erreur inattendue du serveur';
    throw new ApiError(response.status, message);
  }

  return schema.parse(payload);
}
