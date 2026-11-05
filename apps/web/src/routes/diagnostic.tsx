import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, Navigate } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { applyProposal } from '@/features/diagnostic/apply-proposal';
import { buildDiagnosisView } from '@/features/diagnostic/diagnosis-view';
import { DiagnosticStatus } from '@/features/diagnostic/diagnostic-status';
import { SectionCard } from '@/features/diagnostic/section-card';
import { useTicketStore } from '@/features/saisie/ticket-store';
import { requireAnalysis, requireTicketTitle } from '@/lib/ticket-guard';
import { diagnosisQueryOptions } from '@/queries/analysis';

const SUMMARY_BY_STATUS = {
  'pas-pret': 'Le titre est vide : écris-le pour que l’analyse puisse avancer.',
  'presque-pret':
    'Des points bloquants restent à lever. Accepte les propositions de l’agent ci-dessous, ou modifie la saisie.',
  pret: 'Toutes les sections sont remplies et aucun bloquant ne reste : le ticket peut être développé.',
} as const;

export const Route = createFileRoute('/diagnostic')({
  beforeLoad: ({ context }) => {
    requireTicketTitle();
    requireAnalysis(context.queryClient);
  },
  staticData: { breadcrumb: 'Diagnostic' },
  component: DiagnosticPage,
});

function DiagnosticPage() {
  const ticket = useTicketStore((state) => state.ticket);
  const setTicket = useTicketStore((state) => state.setTicket);
  const { data: diagnostic } = useQuery(diagnosisQueryOptions());

  if (!diagnostic) {
    return <Navigate to="/analyse" />;
  }

  const view = buildDiagnosisView(ticket, diagnostic);
  const filledCount = view.sections.filter((section) => section.filled).length;
  const generalIssues = view.issues.filter((issue) => issue.sectionKey === undefined);

  return (
    <main className="mx-auto flex w-full max-w-[860px] flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="text-muted-foreground">
            Diagnostic ·{' '}
            <Link to="/saisie" className="underline underline-offset-4">
              modifier la saisie
            </Link>
          </p>
          <h1 className="text-2xl leading-tight font-semibold tracking-tight">{ticket.title}</h1>
        </div>
        <Link to="/atelier" search={{ vue: 'conversation' }} className={buttonVariants()}>
          Continuer dans l’atelier
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>

      <DiagnosticStatus
        status={view.status}
        blockers={view.blockers}
        recommendations={view.recommendations}
        summary={SUMMARY_BY_STATUS[view.status]}
      />

      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Sections du ticket</h2>
        <span className="text-sm text-muted-foreground">{filledCount} / 4 complétées</span>
      </div>

      <div className="flex flex-col gap-4">
        {view.sections.map((section) => (
          <SectionCard
            key={section.key}
            section={section}
            issues={view.issues.filter((issue) => issue.sectionKey === section.key)}
            proposal={view.proposals.find((proposal) => proposal.sectionKey === section.key)}
            onAccept={(proposal) => setTicket(applyProposal(ticket, proposal))}
          />
        ))}
      </div>

      {generalIssues.length > 0 && (
        <section className="flex flex-col gap-2 rounded-[14px] border p-5">
          <h2 className="font-semibold">Autres recommandations</h2>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
            {generalIssues.map((issue) => (
              <li key={issue.id}>{issue.message}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
