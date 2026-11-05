import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '@/lib/get-error-message';
import { useTicketStore } from '@/features/saisie/ticket-store';
import { useChatStore } from './chat-store';
import { streamChat } from './stream-chat';

export type ChatStatus = 'idle' | 'streaming';

// Envoie un message à l'agent et lit sa réponse en flux. Le message et la réponse rejoignent l'historique.
// Le flux en cours est annulé quand la page est quittée.
export function useChatStream() {
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const send = useCallback(async (text: string) => {
    const message = text.trim();
    if (message === '') {
      return;
    }

    const history = useChatStore
      .getState()
      .turns.map((turn) => ({ role: turn.role, content: turn.text }));
    useChatStore.getState().addUser(message);

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus('streaming');
    setError(null);
    setProgress('L’agent réfléchit…');

    try {
      await streamChat(
        { ticket: useTicketStore.getState().ticket, history, message },
        controller.signal,
        (event) => {
          if (event.type === 'progress') {
            setProgress(event.label);
          } else if (event.type === 'message') {
            useChatStore
              .getState()
              .addAssistant(event.message, event.references, event.quickReplies, event.patch);
          } else if (event.type === 'error') {
            setError(event.message);
          }
        },
      );
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(getErrorMessage(err));
      }
    } finally {
      if (!controller.signal.aborted) {
        setStatus('idle');
        setProgress(null);
      }
    }
  }, []);

  return { send, status, progress, error };
}
