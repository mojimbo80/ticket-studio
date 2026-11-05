import type { ChatReference, TicketPatch } from '@ticket-studio/shared';
import { create } from 'zustand';

export type PatchStatus = 'pending' | 'applied' | 'ignored';

export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  references: ChatReference[];
  quickReplies: string[];
  patch: { value: TicketPatch; status: PatchStatus } | null;
}

interface ChatState {
  turns: ChatTurn[];
  addUser: (text: string) => void;
  addAssistant: (
    text: string,
    references: ChatReference[],
    quickReplies: string[],
    patch: TicketPatch | null,
  ) => void;
  setPatchStatus: (turnId: string, status: PatchStatus) => void;
}

// Historique de la conversation, gardé en mémoire pendant la session (sans persistance).
export const useChatStore = create<ChatState>()((set) => ({
  turns: [],
  addUser: (text) =>
    set((state) => ({
      turns: [
        ...state.turns,
        {
          id: crypto.randomUUID(),
          role: 'user',
          text,
          references: [],
          quickReplies: [],
          patch: null,
        },
      ],
    })),
  addAssistant: (text, references, quickReplies, patch) =>
    set((state) => ({
      turns: [
        ...state.turns,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text,
          references,
          quickReplies,
          patch: patch ? { value: patch, status: 'pending' } : null,
        },
      ],
    })),
  setPatchStatus: (turnId, status) =>
    set((state) => ({
      turns: state.turns.map((turn) =>
        turn.id === turnId && turn.patch ? { ...turn, patch: { ...turn.patch, status } } : turn,
      ),
    })),
}));
