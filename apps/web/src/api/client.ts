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
  body?: unknown;
}

// Seul point d'entrée HTTP du front : chaque réponse est parsée par le schéma Zod fourni.
export async function apiFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  options: ApiFetchOptions = {},
): Promise<T> {
  const response = await sendRequest(path, options.method ?? 'GET', options.body);
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

async function sendRequest(path: string, method: 'GET' | 'POST', body: unknown): Promise<Response> {
  const hasBody = body !== undefined;
  try {
    return await fetch(`${API_BASE_PATH}${path}`, {
      method,
      headers: hasBody
        ? { Accept: 'application/json', 'Content-Type': 'application/json' }
        : { Accept: 'application/json' },
      body: hasBody ? JSON.stringify(body) : undefined,
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
