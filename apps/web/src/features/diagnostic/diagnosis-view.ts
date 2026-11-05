import {
  computeStatus,
  type Diagnostic,
  type DiagnosticStatus,
  evaluateRules,
  getTicketSections,
  type Issue,
  mergeIssues,
  type Proposal,
  type Ticket,
  type TicketSection,
  type TicketSectionKey,
  ticketMentions,
} from '@ticket-studio/shared';

export interface DiagnosisView {
  status: DiagnosticStatus;
  blockers: number;
  recommendations: number;
  sections: TicketSection[];
  issues: Issue[];
  proposals: Proposal[];
}

// Vue recalculée à chaque modification du ticket. Les règles et le statut suivent le ticket.
// Les termes ambigus et les propositions viennent de l'analyse, tant qu'ils restent pertinents.
export function buildDiagnosisView(ticket: Ticket, diagnostic: Diagnostic): DiagnosisView {
  const sections = getTicketSections(ticket);
  const emptyKeys = new Set<TicketSectionKey>(
    sections.filter((section) => !section.filled).map((section) => section.key),
  );

  const ambiguities = diagnostic.issues.flatMap((issue) => {
    if (issue.kind !== 'ambiguite' || !issue.term || !ticketMentions(ticket, issue.term)) {
      return [];
    }
    return [{ ...issue, sectionKey: sectionMentioning(ticket, issue.term) }];
  });

  const issues = mergeIssues(evaluateRules(ticket), ambiguities);
  const proposals = diagnostic.proposals.filter((proposal) => emptyKeys.has(proposal.sectionKey));

  return { ...computeStatus(ticket, issues), sections, issues, proposals };
}

// Section où apparaît le terme : le titre d'abord, puis le contexte, la description et les critères.
function sectionMentioning(ticket: Ticket, term: string): TicketSectionKey {
  const criteria = ticket.scenarios
    .flatMap((scenario) => [scenario.given, scenario.when, scenario.then])
    .join(' ');
  const fields: [TicketSectionKey, string][] = [
    ['title', ticket.title],
    ['context', ticket.context],
    ['description', ticket.description],
    ['criteria', criteria],
  ];
  const lowered = term.toLowerCase();
  return fields.find(([, text]) => text.toLowerCase().includes(lowered))?.[0] ?? 'title';
}
