import {
  type AnalysisStepId,
  getTicketSections,
  type ProjectContext,
  type Ticket,
  type TicketSection,
} from '@ticket-studio/shared';
import { AppError } from '../lib/app-error';
import { repoConfig } from '../repo/config';
import { createToolContext } from '../llm/tools/context';
import type { ToolResult } from '../llm/tools/define-tool';
import { repoTools } from '../llm/tools/repo-tools';
import { getProjectContext } from '../project/project-context';
import { buildDiagnostic } from '../diagnostic/build-diagnostic';
import type { EmitEvent } from './sse';

const MAX_SUMMARY_CHARS = 160;
const MIN_SCREEN_QUERY_CHARS = 3;

export class AnalysisCancelledError extends Error {
  constructor() {
    super('Analyse annulée par le client');
    this.name = 'AnalysisCancelledError';
  }
}

// Déroule les étapes de l'analyse en émettant leur progression, puis envoie le diagnostic.
export async function runAnalysis(
  ticket: Ticket,
  emit: EmitEvent,
  isCancelled: () => boolean,
): Promise<void> {
  const context = await runStep(
    'documentation',
    emit,
    isCancelled,
    () => getProjectContext(),
    describeDocumentation,
  );
  await runStep('donnees', emit, isCancelled, () => Promise.resolve(context), describeData);
  await runStep('evolutions', emit, isCancelled, () => Promise.resolve(context), describeCommits);
  await runStep('ecrans', emit, isCancelled, () => searchScreens(ticket), describeScreens);
  await runStep(
    'sections',
    emit,
    isCancelled,
    () => Promise.resolve(getTicketSections(ticket)),
    describeSections,
  );

  emit({ type: 'done', diagnostic: await buildDiagnostic(ticket) });
}

async function runStep<T>(
  step: AnalysisStepId,
  emit: EmitEvent,
  isCancelled: () => boolean,
  work: () => Promise<T>,
  describe: (value: T) => string,
): Promise<T> {
  if (isCancelled()) {
    throw new AnalysisCancelledError();
  }
  emit({ type: 'progress', step, status: 'running' });
  const value = await work();
  emit({ type: 'progress', step, status: 'done', detail: describe(value) });
  return value;
}

function describeDocumentation(context: ProjectContext): string {
  if (context.readmeSummary === null) {
    return 'Aucun README trouvé dans le projet';
  }
  return truncate(context.readmeSummary, MAX_SUMMARY_CHARS);
}

function describeData(context: ProjectContext): string {
  const count = context.endpoints.length;
  return `${count} ${count > 1 ? 'endpoints recensés' : 'endpoint recensé'}`;
}

function describeCommits(context: ProjectContext): string {
  const [latest] = context.commits;
  if (!latest) {
    return 'Aucun commit trouvé';
  }
  return `${context.commits.length} commits récents, le dernier : ${truncate(latest.subject, MAX_SUMMARY_CHARS)}`;
}

// Recherche d'écrans proches du titre, avec le même outil que l'agent.
async function searchScreens(ticket: Ticket): Promise<ToolResult> {
  const need = ticket.title.trim();
  if (need.length < MIN_SCREEN_QUERY_CHARS) {
    return { content: 'Titre trop court pour la recherche', isError: true };
  }

  const tool = repoTools.find((candidate) => candidate.name === 'find_similar_screens');
  if (!tool) {
    throw new AppError(500, 'Outil de recherche d’écrans indisponible');
  }
  return tool.execute({ need }, createToolContext(repoConfig.dir));
}

function describeScreens(result: ToolResult): string {
  if (result.isError) {
    return result.content;
  }
  const count = (result.content.match(/\(score \d+\)/g) ?? []).length;
  if (count === 0) {
    return 'Aucun écran proche trouvé';
  }
  return `${count} ${count > 1 ? 'écrans ou composants proches' : 'écran ou composant proche'}`;
}

function describeSections(sections: TicketSection[]): string {
  const filled = sections.filter((section) => section.filled).length;
  return `${filled} section(s) sur ${sections.length} remplie(s)`;
}

function truncate(text: string, maxChars: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= maxChars ? clean : `${clean.slice(0, maxChars - 1)}…`;
}
