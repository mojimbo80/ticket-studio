import { createFileRoute } from '@tanstack/react-router';
import { DiagnosticSummary } from '@/features/saisie/diagnostic-summary';
import { SaisieForm } from '@/features/saisie/saisie-form';

export const Route = createFileRoute('/saisie')({
  staticData: { breadcrumb: 'Saisie' },
  component: SaisiePage,
});

function SaisiePage() {
  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-7 px-6 py-10">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl leading-tight font-semibold tracking-tight">Nouveau ticket</h1>
        <p className="text-muted-foreground">
          Seul le titre est obligatoire. Plus tu remplis, plus le diagnostic sera précis.
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <SaisieForm />
        <DiagnosticSummary />
      </div>
    </main>
  );
}
