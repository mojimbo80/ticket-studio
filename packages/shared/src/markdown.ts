import type { Ticket, TicketType } from './ticket';

export const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  story: 'User story',
  bug: 'Bug',
  tech: 'Technique',
};

// Éléments gérés par l'atelier, hors du ticket lui-même.
export interface MarkdownExtras {
  precisions?: { label: string; text: string }[];
  openQuestions?: string[];
}

// Ticket en Markdown simple (titres, paragraphes, listes) : il se colle tel quel dans Jira, Trello ou Monday.
// Pas de HTML ni de tableau. Les sections vides sont omises.
export function ticketToMarkdown(ticket: Ticket, extras: MarkdownExtras = {}): string {
  const blocks: string[] = [
    `# ${ticket.title.trim()}`,
    `Type : ${TICKET_TYPE_LABELS[ticket.type]}`,
  ];

  pushParagraph(blocks, 'Contexte', ticket.context);
  pushParagraph(blocks, 'Description', ticket.description);

  if (ticket.scenarios.length > 0) {
    blocks.push('## Critères d’acceptation');
    ticket.scenarios.forEach((scenario, index) => {
      blocks.push(
        [
          `### Scénario ${index + 1}`,
          `- Given ${scenario.given.trim()}`,
          `- When ${scenario.when.trim()}`,
          `- Then ${scenario.then.trim()}`,
        ].join('\n'),
      );
    });
  }

  const precisions = extras.precisions ?? [];
  if (precisions.length > 0) {
    pushList(
      blocks,
      'Précisions',
      precisions.map((precision) => `${precision.label.trim()} : ${precision.text.trim()}`),
    );
  }

  pushList(blocks, 'Questions ouvertes', extras.openQuestions ?? []);
  pushList(blocks, 'Liens', ticket.links);

  return `${blocks.join('\n\n')}\n`;
}

function pushParagraph(blocks: string[], heading: string, text: string): void {
  if (text.trim() !== '') {
    blocks.push(`## ${heading}`, text.trim());
  }
}

function pushList(blocks: string[], heading: string, items: string[]): void {
  if (items.length > 0) {
    blocks.push(`## ${heading}`, items.map((item) => `- ${item.trim()}`).join('\n'));
  }
}
