import type { Proposal, Ticket } from '@ticket-studio/shared';

// Intègre une proposition acceptée dans le ticket : texte pour le contexte et la description, scénario pour les critères.
export function applyProposal(ticket: Ticket, proposal: Proposal): Ticket {
  switch (proposal.sectionKey) {
    case 'context':
      return { ...ticket, context: proposal.text };
    case 'description':
      return { ...ticket, description: proposal.text };
    case 'criteria':
      return proposal.scenario
        ? { ...ticket, scenarios: [...ticket.scenarios, proposal.scenario] }
        : ticket;
  }
}
