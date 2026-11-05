import { type AnalysisEvent, AnalysisEventSchema, type Ticket } from '@ticket-studio/shared';
import { streamEvents } from '@/api/sse-client';

// Lit le flux SSE de POST /api/analyze. Le flux se termine par « done » ou « error ».
export function streamAnalysis(
  ticket: Ticket,
  signal: AbortSignal,
  onEvent: (event: AnalysisEvent) => void,
): Promise<void> {
  return streamEvents({
    path: '/analyze',
    body: ticket,
    schema: AnalysisEventSchema,
    signal,
    onEvent,
    isTerminal: (event) => event.type === 'done' || event.type === 'error',
    interruptedMessage: 'Le flux d’analyse s’est interrompu',
  });
}
