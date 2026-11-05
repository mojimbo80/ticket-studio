import {
  computeStatus,
  type Diagnostic,
  type DiagnosticStatus,
  type Issue,
  type Suggestion,
  type Ticket,
  type TicketSection,
} from '@ticket-studio/shared';
import { buildDiagnosisView } from '@/features/diagnostic/diagnosis-view';
import type { AtelierAnswers } from './atelier-store';

const OPEN_QUESTION_ANSWER = /question ouverte/i;

export interface Precision {
  id: string;
  label: string;
  text: string;
}

export interface OpenQuestion {
  id: string;
  title: string;
}

export interface AtelierView {
  status: DiagnosticStatus;
  blockers: number;
  recommendations: number;
  // Points encore actifs : les termes précisés dans l'atelier n'y figurent plus.
  issues: Issue[];
  sections: TicketSection[];
  precisions: Precision[];
  openQuestions: OpenQuestion[];
  remaining: number;
  validated: string[];
}

// Vue de l'atelier, recalculée à chaque changement du ticket ou des réponses.
export function buildAtelierView(
  ticket: Ticket,
  diagnostic: Diagnostic,
  suggestions: Suggestion[],
  answers: AtelierAnswers,
): AtelierView {
  const base = buildDiagnosisView(ticket, diagnostic);

  const answered = suggestions.flatMap((suggestion) => {
    const resolution = answers.resolutions[suggestion.id];
    return resolution?.status === 'answered' ? [{ suggestion, answer: resolution.answer }] : [];
  });

  const clarified = new Set(
    answered
      .filter(({ suggestion, answer }) => suggestion.kind === 'preciser' && !isOpenAnswer(answer))
      .map(({ suggestion }) => `${suggestion.title} ${suggestion.body}`.toLowerCase())
      .flatMap((text) =>
        base.issues
          .filter(
            (issue) =>
              issue.kind === 'ambiguite' && issue.term && text.includes(issue.term.toLowerCase()),
          )
          .map((issue) => issue.id),
      ),
  );

  const issues = base.issues.filter((issue) => !clarified.has(issue.id));
  const clarifiedIssues = base.issues.filter((issue) => clarified.has(issue.id));

  return {
    ...computeStatus(ticket, issues),
    issues,
    sections: base.sections,
    precisions: [
      ...answered
        .filter(({ answer }) => !isOpenAnswer(answer))
        .map(({ suggestion, answer }) => ({
          id: suggestion.id,
          label: suggestion.sourceLabel,
          text: answer,
        })),
      ...answers.manualPrecisions,
    ],
    openQuestions: [
      ...answered
        .filter(({ answer }) => isOpenAnswer(answer))
        .map(({ suggestion }) => ({ id: suggestion.id, title: suggestion.title })),
      ...answers.manualQuestions.map((question) => ({ id: question.id, title: question.question })),
    ],
    remaining: suggestions.filter((suggestion) => answers.resolutions[suggestion.id] === undefined)
      .length,
    validated: [
      ...base.sections.filter((section) => section.filled).map((section) => section.label),
      ...clarifiedIssues.map((issue) => `Terme « ${issue.term ?? ''} » précisé`),
    ],
  };
}

function isOpenAnswer(answer: string): boolean {
  return OPEN_QUESTION_ANSWER.test(answer);
}
