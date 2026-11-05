import { z } from 'zod';
import { getTicketSections } from './ticket-sections';
import { ScenarioSchema, type Ticket } from './ticket';

export const TicketSectionKeySchema = z.enum(['title', 'context', 'description', 'criteria']);

export const TicketSectionSchema = z.object({
  key: TicketSectionKeySchema,
  label: z.string(),
  filled: z.boolean(),
});

export const IssueKindSchema = z.enum([
  'section-vide',
  'ambiguite',
  'absence-cas-negatif',
  'absence-cas-erreur',
  'absence-lien-maquette',
]);

// Un point relevé sur le ticket : bloquant (empêche de développer) ou recommandation.
export const IssueSchema = z.object({
  id: z.string(),
  kind: IssueKindSchema,
  severity: z.enum(['bloquant', 'recommandation']),
  message: z.string(),
  sectionKey: TicketSectionKeySchema.optional(),
  term: z.string().optional(),
});

// Proposition de l'agent pour une section vide. Un scénario n'est présent que pour les critères.
export const ProposalSchema = z.object({
  id: z.string(),
  sectionKey: z.enum(['context', 'description', 'criteria']),
  text: z.string(),
  scenario: ScenarioSchema.nullable(),
  assumption: z.string().nullable(),
  sources: z.array(z.string()),
});

export const DiagnosticSchema = z.object({
  status: z.enum(['pas-pret', 'presque-pret', 'pret']),
  blockers: z.number().int().min(0),
  recommendations: z.number().int().min(0),
  sections: z.array(TicketSectionSchema),
  issues: z.array(IssueSchema),
  proposals: z.array(ProposalSchema),
});

export type TicketSectionKey = z.infer<typeof TicketSectionKeySchema>;
export type TicketSection = z.infer<typeof TicketSectionSchema>;
export type Issue = z.infer<typeof IssueSchema>;
export type Proposal = z.infer<typeof ProposalSchema>;
export type Diagnostic = z.infer<typeof DiagnosticSchema>;
export type DiagnosticStatus = Diagnostic['status'];

// Un cas négatif décrit un refus, une impossibilité ou un état exclu.
const NEGATIVE_CASE_PATTERN =
  /(refus|impossible|interdit|non autoris|ne peut pas|ne doit pas|expir|vide)/i;
// Un cas d'erreur décrit un message, un échec ou un état bloqué.
const ERROR_CASE_PATTERN = /(erreur|échec|echec|message d|bloqu|indisponible|invalide)/i;

// Règles déterministes : elles ne dépendent jamais du LLM.
export function evaluateRules(ticket: Ticket): Issue[] {
  const issues: Issue[] = getTicketSections(ticket)
    .filter((section) => !section.filled)
    .map((section) => ({
      id: `section-vide-${section.key}`,
      kind: 'section-vide',
      severity: 'bloquant',
      message: `La section « ${section.label} » est vide`,
      sectionKey: section.key,
    }));

  const scenarioText = ticket.scenarios
    .map((scenario) => `${scenario.given} ${scenario.when} ${scenario.then}`)
    .join(' ');

  if (!NEGATIVE_CASE_PATTERN.test(scenarioText)) {
    issues.push({
      id: 'absence-cas-negatif',
      kind: 'absence-cas-negatif',
      severity: 'recommandation',
      message: 'Aucun cas négatif n’est décrit dans les critères',
      sectionKey: 'criteria',
    });
  }
  if (!ERROR_CASE_PATTERN.test(scenarioText)) {
    issues.push({
      id: 'absence-cas-erreur',
      kind: 'absence-cas-erreur',
      severity: 'recommandation',
      message: 'Aucun cas d’erreur n’est décrit dans les critères',
      sectionKey: 'criteria',
    });
  }
  if (ticket.links.length === 0) {
    issues.push({
      id: 'absence-lien-maquette',
      kind: 'absence-lien-maquette',
      severity: 'recommandation',
      message: 'Aucun lien de maquette ou de ticket lié',
    });
  }

  return issues;
}

// Statut calculé uniquement à partir du ticket et des points relevés, jamais par le LLM.
export function computeStatus(
  ticket: Ticket,
  issues: Issue[],
): { status: DiagnosticStatus; blockers: number; recommendations: number } {
  const blockers = issues.filter((issue) => issue.severity === 'bloquant').length;
  const recommendations = issues.filter((issue) => issue.severity === 'recommandation').length;

  let status: DiagnosticStatus = 'pret';
  if (ticket.title.trim() === '') {
    status = 'pas-pret';
  } else if (blockers > 0) {
    status = 'presque-pret';
  }
  return { status, blockers, recommendations };
}

// Vrai si le terme apparaît dans le texte du ticket, sans tenir compte de la casse.
export function ticketMentions(ticket: Ticket, term: string): boolean {
  const text = [
    ticket.title,
    ticket.context,
    ticket.description,
    ...ticket.scenarios.flatMap((scenario) => [scenario.given, scenario.when, scenario.then]),
  ]
    .join(' ')
    .toLowerCase();
  return text.includes(term.trim().toLowerCase());
}

// Fusionne plusieurs listes de points sans doublon, en gardant la première occurrence.
export function mergeIssues(...lists: Issue[][]): Issue[] {
  const unique = new Map<string, Issue>();
  for (const issue of lists.flat()) {
    if (!unique.has(issue.id)) {
      unique.set(issue.id, issue);
    }
  }
  return [...unique.values()];
}
