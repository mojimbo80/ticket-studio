import { type AnalysisEvent, AnalysisEventSchema } from '@ticket-studio/shared';
import type { Response } from 'express';

export type EmitEvent = (event: AnalysisEvent) => void;

// Ouvre un flux Server-Sent Events. Chaque événement est validé avant envoi.
export function openEventStream(res: Response): EmitEvent {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  return (event) => {
    // Un client parti n'a plus besoin des événements : on n'écrit pas dans une connexion fermée.
    if (res.writableEnded || res.destroyed) {
      return;
    }
    const payload = AnalysisEventSchema.parse(event);
    res.write(`event: ${payload.type}\ndata: ${JSON.stringify(payload)}\n\n`);
  };
}
