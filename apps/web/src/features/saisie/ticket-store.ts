import type { Ticket } from '@ticket-studio/shared';
import { create } from 'zustand';

export const EMPTY_TICKET: Ticket = {
  type: 'story',
  title: '',
  context: '',
  description: '',
  scenarios: [],
  links: [],
};

interface TicketState {
  ticket: Ticket;
  setTicket: (ticket: Ticket) => void;
}

// État du ticket pendant tout le parcours. Gardé en mémoire uniquement : rien n'est persisté côté serveur.
export const useTicketStore = create<TicketState>()((set) => ({
  ticket: EMPTY_TICKET,
  setTicket: (ticket) => set({ ticket }),
}));

export function hasTicketTitle(ticket: Ticket): boolean {
  return ticket.title.trim().length > 0;
}
