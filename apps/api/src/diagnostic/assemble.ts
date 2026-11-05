import {
  computeStatus,
  type Diagnostic,
  DiagnosticSchema,
  evaluateRules,
  getTicketSections,
  type Issue,
  mergeIssues,
  ticketMentions,
  type Proposal,
  type Ticket,
  type TicketSectionKey,
} from '@ticket-studio/shared';
import type { LlmDiagnosis } from './llm-schema';

const UNVERIFIED_ASSUMPTION = 'Aucune source du projet ne confirme cette proposition.';

// Assemble le diagnostic à partir des règles, de la réponse du LLM et des fichiers réellement lus.
// Le statut est calculé ici, jamais par le LLM. Une source non lue est retirée.
export function assembleDiagnosis(
  ticket: Ticket,
  llm: LlmDiagnosis,
  readFiles: string[],
): Diagnostic {
  const sections = getTicketSections(ticket);
  const emptyKeys = new Set(sections.filter((section) => !section.filled).map((s) => s.key));

  const proposals = keepFirstPerSection(
    llm.proposals.flatMap((raw) => toProposal(raw, emptyKeys, readFiles)),
  );
  const issues = mergeIssues(evaluateRules(ticket), toAmbiguityIssues(ticket, llm));

  return DiagnosticSchema.parse({
    ...computeStatus(ticket, issues),
    sections,
    issues,
    proposals,
  });
}

// Une proposition n'est gardée que pour une section réellement vide, et ses sources doivent avoir été lues.
function toProposal(
  raw: LlmDiagnosis['proposals'][number],
  emptyKeys: Set<TicketSectionKey>,
  readFiles: string[],
): Proposal[] {
  if (!emptyKeys.has(raw.sectionKey)) {
    return [];
  }
  if (raw.sectionKey === 'criteria' && raw.scenario === null) {
    return [];
  }

  const readSet = new Set(readFiles);
  const sources = raw.sources
    .map((source) => source.trim().replace(/^\.\//, ''))
    .filter((source) => readSet.has(source));
  const assumption =
    raw.assumption?.trim() || (sources.length === 0 ? UNVERIFIED_ASSUMPTION : null);

  return [
    {
      id: `proposition-${raw.sectionKey}`,
      sectionKey: raw.sectionKey,
      text: raw.text.trim(),
      scenario: raw.sectionKey === 'criteria' ? raw.scenario : null,
      assumption,
      sources,
    },
  ];
}

// Un terme ambigu n'est retenu que s'il apparaît réellement dans le ticket.
function toAmbiguityIssues(ticket: Ticket, llm: LlmDiagnosis): Issue[] {
  const seen = new Set<string>();
  return llm.ambiguousTerms.flatMap((raw) => {
    const term = raw.term.trim();
    const key = term.toLowerCase();
    if (term === '' || seen.has(key) || !ticketMentions(ticket, term)) {
      return [];
    }
    seen.add(key);
    return [
      {
        id: `ambiguite-${key}`,
        kind: 'ambiguite',
        severity: 'bloquant',
        message: `Le terme « ${term} » peut désigner plusieurs réalités : ${raw.reason.trim()}`,
        term,
      },
    ];
  });
}

function keepFirstPerSection(proposals: Proposal[]): Proposal[] {
  const seen = new Set<string>();
  return proposals.filter((proposal) => {
    if (seen.has(proposal.sectionKey)) {
      return false;
    }
    seen.add(proposal.sectionKey);
    return true;
  });
}
