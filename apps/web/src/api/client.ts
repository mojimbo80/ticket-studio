import { ErrorResponseSchema } from '@ticket-studio/shared';
import type { z } from 'zod';

const API_BASE_PATH = '/api';

// Origine d'un échec : réseau injoignable, réponse d'erreur du serveur, ou réponse qui ne respecte pas le schéma.
export type ApiErrorKind = 'network' | 'http' | 'invalid-response';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;

  constructor(kind: ApiErrorKind, status: number | null, message: string) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

interface ApiFetchOptions {
  method?: 'GET' | 'POST';
}

// Seul point d'entrée HTTP du front : chaque réponse est parsée par le schéma Zod fourni.
export async function apiFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  options: ApiFetchOptions = {},
): Promise<T> {
  const response = await sendRequest(path, options.method ?? 'GET');
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw toHttpError(response.status, payload);
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError('invalid-response', response.status, 'Réponse inattendue du serveur');
  }
  return parsed.data;
}

async function sendRequest(path: string, method: 'GET' | 'POST'): Promise<Response> {
  try {
    return await fetch(`${API_BASE_PATH}${path}`, {
      method,
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new ApiError('network', null, "L'API est injoignable. Vérifiez qu'elle est démarrée.");
  }
}

function toHttpError(status: number, payload: unknown): ApiError {
  const parsed = ErrorResponseSchema.safeParse(payload);
  const message = parsed.success ? parsed.data.message : 'Erreur inattendue du serveur';
  return new ApiError('http', status, message);
}
