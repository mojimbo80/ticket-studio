import { type AnalysisEvent, AnalysisEventSchema, type Ticket } from '@ticket-studio/shared';
import { ApiError } from '@/api/client';

const ANALYZE_PATH = '/api/analyze';
const FRAME_SEPARATOR = '\n\n';

// Lit le flux SSE de POST /api/analyze. Chaque événement est validé avant d'être transmis.
// Le flux se termine par un événement « done » ou « error ».
export async function streamAnalysis(
  ticket: Ticket,
  signal: AbortSignal,
  onEvent: (event: AnalysisEvent) => void,
): Promise<void> {
  const response = await sendRequest(ticket, signal);
  if (!response.ok) {
    throw new ApiError('http', response.status, 'Analyse impossible pour le moment');
  }
  if (!response.body) {
    throw new ApiError('invalid-response', response.status, 'Flux d’analyse indisponible');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      throw new ApiError('network', null, 'Le flux d’analyse s’est interrompu');
    }

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split(FRAME_SEPARATOR);
    buffer = frames.pop() ?? '';

    for (const frame of frames) {
      const event = parseFrame(frame);
      if (event === null) {
        continue;
      }
      onEvent(event);
      if (event.type === 'done' || event.type === 'error') {
        await reader.cancel();
        return;
      }
    }
  }
}

async function sendRequest(ticket: Ticket, signal: AbortSignal): Promise<Response> {
  try {
    return await fetch(ANALYZE_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(ticket),
      signal,
    });
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }
    throw new ApiError('network', null, "L'API est injoignable. Vérifiez qu'elle est démarrée.");
  }
}

// Une trame SSE contient une ou plusieurs lignes « data: ». Les autres lignes (event:, commentaires) sont ignorées.
function parseFrame(frame: string): AnalysisEvent | null {
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
    throw new ApiError('invalid-response', null, 'Événement d’analyse illisible');
  }

  const parsed = AnalysisEventSchema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError('invalid-response', null, 'Événement d’analyse inattendu');
  }
  return parsed.data;
}
