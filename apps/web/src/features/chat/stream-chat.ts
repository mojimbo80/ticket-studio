import { type ChatEvent, ChatEventSchema, type ChatRequest } from '@ticket-studio/shared';
import { streamEvents } from '@/api/sse-client';

// Lit le flux SSE de POST /api/chat. Le flux se termine par « done » ou « error ».
export function streamChat(
  request: ChatRequest,
  signal: AbortSignal,
  onEvent: (event: ChatEvent) => void,
): Promise<void> {
  return streamEvents({
    path: '/chat',
    body: request,
    schema: ChatEventSchema,
    signal,
    onEvent,
    isTerminal: (event) => event.type === 'done' || event.type === 'error',
    interruptedMessage: 'La réponse de l’agent s’est interrompue',
  });
}
