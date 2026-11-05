import { Link } from '@tanstack/react-router';
import type { Issue } from '@ticket-studio/shared';
import { AlertTriangle, Check } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { DiagnosticStatus } from '@/features/diagnostic/diagnostic-status';
import type { AtelierView } from './atelier-view';

const SUMMARY_BY_STATUS = {
  'pas-pret': 'Le titre est vide : écris-le pour pouvoir développer.',
  'presque-pret':
    'Les bloquants empêchent de démarrer. Les recommandations améliorent le ticket sans bloquer l’équipe.',
  pret: 'Aucun bloquant : l’équipe peut démarrer.',
} as const;

const actionClass = buttonVariants({ variant: 'outline', size: 'sm' });

interface DiagnosticPanelProps {
  view: AtelierView;
}

// Diagnostic détaillé : bloquants, recommandations avec leur action, et critères validés.
export function DiagnosticPanel({ view }: DiagnosticPanelProps) {
  const blockers = view.issues.filter((issue) => issue.severity === 'bloquant');
  const recommendations = view.issues.filter((issue) => issue.severity === 'recommandation');

  return (
    <div className="flex flex-col gap-6">
      <DiagnosticStatus
        status={view.status}
        blockers={view.blockers}
        recommendations={view.recommendations}
        summary={SUMMARY_BY_STATUS[view.status]}
      />

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">
          Bloquants <span className="text-muted-foreground">· {blockers.length}</span>
        </h2>
        {blockers.length === 0 ? (
          <p className="text-muted-foreground">Aucun bloquant.</p>
        ) : (
          blockers.map((issue) => <IssueRow key={issue.id} issue={issue} tone="blocker" />)
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">
          Recommandations{' '}
          <span className="text-muted-foreground">
            · {recommendations.length + view.openQuestions.length + (view.remaining > 0 ? 1 : 0)}
          </span>
        </h2>
        {recommendations.map((issue) => (
          <IssueRow key={issue.id} issue={issue} tone="recommendation" />
        ))}
        {view.openQuestions.map((question) => (
          <div
            key={question.suggestionId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border p-3 text-sm"
          >
            <span>Question ouverte : {question.title}</span>
            <Link to="/atelier" search={{ vue: 'suggestions' }} className={actionClass}>
              Trancher la question
            </Link>
          </div>
        ))}
        {view.remaining > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border p-3 text-sm">
            <span>
              {view.remaining}{' '}
              {view.remaining > 1 ? 'suggestions non examinées' : 'suggestion non examinée'}
            </span>
            <Link to="/atelier" search={{ vue: 'suggestions' }} className={actionClass}>
              Voir les suggestions
            </Link>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">
          Validés <span className="text-muted-foreground">· {view.validated.length}</span>
        </h2>
        <ul className="flex flex-col gap-2 text-sm">
          {view.validated.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <Check className="size-4 text-green-600" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// Action proposée pour un point : répondre dans les suggestions, ou compléter la saisie.
function IssueRow({ issue, tone }: { issue: Issue; tone: 'blocker' | 'recommendation' }) {
  const isBlocker = tone === 'blocker';
  return (
    <div
      role={isBlocker ? 'alert' : undefined}
      className={
        isBlocker
          ? 'flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-red-200 bg-red-50 p-3 text-sm text-red-800'
          : 'flex flex-wrap items-center justify-between gap-3 rounded-[10px] border p-3 text-sm'
      }
    >
      <span className="flex items-start gap-2">
        {isBlocker && <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
        {issue.message}
      </span>
      {issue.kind === 'ambiguite' ? (
        <Link to="/atelier" search={{ vue: 'suggestions' }} className={actionClass}>
          Répondre à la suggestion
        </Link>
      ) : (
        <Link to="/saisie" className={actionClass}>
          {actionLabel(issue)}
        </Link>
      )}
    </div>
  );
}

function actionLabel(issue: Issue): string {
  switch (issue.kind) {
    case 'section-vide':
      return 'Compléter la section';
    case 'absence-lien-maquette':
      return 'Ajouter un lien';
    default:
      return 'Modifier la saisie';
  }
}
