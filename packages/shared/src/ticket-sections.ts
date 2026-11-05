import type { TicketSection } from './diagnostic';
import type { Scenario, Ticket } from './ticket';

// Les quatre sections de l'encart « Avant le diagnostic ».
export function getTicketSections(ticket: Ticket): TicketSection[] {
  return [
    { key: 'title', label: 'Titre', filled: ticket.title.trim() !== '' },
    { key: 'context', label: 'Contexte', filled: ticket.context.trim() !== '' },
    { key: 'description', label: 'Description', filled: ticket.description.trim() !== '' },
    {
      key: 'criteria',
      label: "Critères d'acceptation",
      filled: ticket.scenarios.some(isCompleteScenario),
    },
  ];
}

function isCompleteScenario(scenario: Scenario): boolean {
  return [scenario.given, scenario.when, scenario.then].every((part) => part.trim() !== '');
}
