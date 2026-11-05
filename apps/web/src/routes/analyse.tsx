import { createFileRoute, Link } from '@tanstack/react-router';
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AnalysisSteps } from '@/features/analyse/analysis-steps';
import { useAnalysisStream } from '@/features/analyse/use-analysis-stream';
import { useTicketStore } from '@/features/saisie/ticket-store';
import { requireTicketTitle } from '@/lib/ticket-guard';

export const Route = createFileRoute('/analyse')({
  beforeLoad: () => requireTicketTitle(),
  staticData: { breadcrumb: 'Analyse' },
  component: AnalysePage,
});

function AnalysePage() {
  const ticket = useTicketStore((state) => state.ticket);
  const { state, retry } = useAnalysisStream(ticket);

  const total = state.steps.length;
  const completed = state.steps.filter((step) => step.status === 'done').length;
  const pct = Math.round((completed / total) * 100);
  const progressLabel =
    state.status === 'done' ? 'Terminé' : `Étape ${Math.min(completed + 1, total)} sur ${total}`;
  const sectionsToComplete =
    state.diagnostic?.sections.filter((section) => !section.filled).length ?? 0;

  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-col gap-7 px-6 py-10">
      <section className="flex flex-col gap-1.5">
        <p className="text-muted-foreground">Analyse de ton ticket</p>
        <h1 className="text-2xl leading-tight font-semibold tracking-tight">{ticket.title}</h1>
      </section>

      <section className="flex flex-col gap-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{progressLabel}</span>
          <span className="font-medium">{pct} %</span>
        </div>
        <Progress value={pct} aria-label="Progression de l'analyse" />
      </section>

      {state.status === 'error' ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>L'analyse a échoué</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            <span>{state.errorMessage ?? 'Une erreur inattendue est survenue.'}</span>
            <Button variant="outline" size="sm" onClick={retry}>
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <AnalysisSteps steps={state.steps} />
      )}

      {state.status === 'done' && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] border p-4"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-green-600" aria-hidden="true" />
            <span className="font-medium">Analyse terminée</span>
            <span className="text-muted-foreground">
              · {sectionsToComplete} section(s) à compléter
            </span>
          </span>
          <Link to="/diagnostic" className={buttonVariants()}>
            Voir le diagnostic
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      )}

      {state.status === 'running' && (
        <div className="flex justify-end">
          <Link to="/diagnostic" className={buttonVariants({ variant: 'ghost' })}>
            Passer
          </Link>
        </div>
      )}
    </main>
  );
}
