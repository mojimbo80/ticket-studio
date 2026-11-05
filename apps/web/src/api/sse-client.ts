import { ApiError } from './client';
import type { z } from 'zod';

const FRAME_SEPARATOR = '\n\n';

interface StreamOptions<T> {
  path: string;
  body: unknown;
  schema: z.ZodType<T>;
  signal: AbortSignal;
  onEvent: (event: T) => void;
  // Vrai pour l'événement qui termine le flux (done, error…).
  isTerminal: (event: T) => boolean;
  // Message affiché si le flux se coupe avant l'événement terminal.
  interruptedMessage: string;
}

// Lit un flux SSE émis par POST : chaque trame est validée par le schéma avant d'être transmise.
export async function streamEvents<T>(options: StreamOptions<T>): Promise<void> {
  const response = await sendRequest(options);
  if (!response.ok) {
    throw new ApiError('http', response.status, 'La requête a échoué pour le moment');
  }
  if (!response.body) {
    throw new ApiError('invalid-response', response.status, 'Flux indisponible');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      throw new ApiError('network', null, options.interruptedMessage);
    }

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split(FRAME_SEPARATOR);
    buffer = frames.pop() ?? '';

    for (const frame of frames) {
      const event = parseFrame(frame, options.schema);
      if (event === null) {
        continue;
      }
      options.onEvent(event);
      if (options.isTerminal(event)) {
        await reader.cancel();
        return;
      }
    }
  }
}

async function sendRequest<T>(options: StreamOptions<T>): Promise<Response> {
  try {
    return await fetch(`/api${options.path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if (options.signal.aborted) {
      throw error;
    }
    throw new ApiError('network', null, "L'API est injoignable. Vérifiez qu'elle est démarrée.");
  }
}

// Une trame SSE contient une ou plusieurs lignes « data: ». Les autres lignes (event:, commentaires) sont ignorées.
function parseFrame<T>(frame: string, schema: z.ZodType<T>): T | null {
  const data = frame
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice('data:'.length).trimStart())
    .join('\n');
  if (data === '') {
    return null;
  }

  let json: unknown;
  try {
    json = JSON.parse(data);
  } catch {
    throw new ApiError('invalid-response', null, 'Événement illisible');
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError('invalid-response', null, 'Événement inattendu');
  }
  return parsed.data;
}
