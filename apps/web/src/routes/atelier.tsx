import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Navigate } from '@tanstack/react-router';
import { z } from 'zod';
import { SidebarProvider } from '@/components/ui/sidebar';
import { type AtelierTab, AtelierSidebar } from '@/features/atelier/atelier-sidebar';
import { type AtelierAnswers, useAtelierStore } from '@/features/atelier/atelier-store';
import { buildAtelierView } from '@/features/atelier/atelier-view';
import { DiagnosticPanel } from '@/features/atelier/diagnostic-panel';
import { SuggestionsPanel } from '@/features/atelier/suggestions-panel';
import { TicketPanel } from '@/features/atelier/ticket-panel';
import { ConversationPanel } from '@/features/chat/conversation-panel';
import { useTicketStore } from '@/features/saisie/ticket-store';
import { requireAnalysis, requireTicketTitle } from '@/lib/ticket-guard';
import { diagnosisQueryOptions } from '@/queries/analysis';
import { projectContextQueryOptions } from '@/queries/project';
import { suggestionsQueryOptions } from '@/queries/suggestions';

const atelierSearchSchema = z.object({
  vue: z.enum(['conversation', 'suggestions', 'diagnostic']).catch('conversation'),
  // Demande pré-remplie dans la conversation, venant d'une recommandation du diagnostic.
  demande: z.string().max(500).optional().catch(undefined),
});

const PANEL_TEXT: Record<AtelierTab, { title: string; sub: string }> = {
  conversation: { title: 'Conversation', sub: 'L’agent affine le ticket avec toi.' },
  suggestions: {
    title: 'Suggestions',
    sub: 'Des points oubliés ou à préciser, repérés dans le projet. Ta réponse est ajoutée au ticket.',
  },
  diagnostic: {
    title: 'Diagnostic détaillé',
    sub: 'Prêt à développer = aucun bloquant. Les recommandations améliorent le ticket sans bloquer l’équipe.',
  },
};

export const Route = createFileRoute('/atelier')({
  validateSearch: atelierSearchSchema,
  beforeLoad: ({ context }) => {
    requireTicketTitle();
    requireAnalysis(context.queryClient);
  },
  staticData: { breadcrumb: 'Atelier' },
  component: AtelierPage,
});

function AtelierPage() {
  const { vue, demande } = Route.useSearch();
  const ticket = useTicketStore((state) => state.ticket);
  const resolutions = useAtelierStore((state) => state.resolutions);
  const manualPrecisions = useAtelierStore((state) => state.manualPrecisions);
  const manualQuestions = useAtelierStore((state) => state.manualQuestions);
  const { data: diagnostic } = useQuery(diagnosisQueryOptions());
  const suggestionsQuery = useQuery(suggestionsQueryOptions(ticket));
  const { data: project } = useQuery(projectContextQueryOptions());

  if (!diagnostic) {
    return <Navigate to="/analyse" />;
  }

  const answers: AtelierAnswers = { resolutions, manualPrecisions, manualQuestions };
  const view = buildAtelierView(
    ticket,
    diagnostic,
    suggestionsQuery.data?.suggestions ?? [],
    answers,
  );

  return (
    <SidebarProvider>
      <AtelierSidebar
        tab={vue}
        view={view}
        repoName={project?.repo.name}
        branch={project?.repo.branch}
      />

      <main className="flex min-w-0 flex-1 flex-col gap-6 p-6 lg:flex-row">
        <section className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">{PANEL_TEXT[vue].title}</h1>
            <p className="text-muted-foreground">{PANEL_TEXT[vue].sub}</p>
          </header>

          {vue === 'conversation' && (
            // La clé remonte le panneau quand une nouvelle demande arrive, pour reprendre le brouillon.
            <ConversationPanel key={demande ?? ''} initialDraft={demande ?? ''} />
          )}

          {vue === 'suggestions' && (
            <SuggestionsPanel
              suggestions={suggestionsQuery.data?.suggestions}
              isPending={suggestionsQuery.isPending}
              error={suggestionsQuery.error}
              onRetry={() => void suggestionsQuery.refetch()}
            />
          )}

          {vue === 'diagnostic' && <DiagnosticPanel view={view} />}
        </section>

        <div className="w-full shrink-0 lg:w-[380px]">
          <TicketPanel ticket={ticket} view={view} />
        </div>
      </main>
    </SidebarProvider>
  );
}
