import { Link } from '@tanstack/react-router';
import { type Ticket, type TicketType } from '@ticket-studio/shared';
import { CircleHelp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AtelierView } from './atelier-view';

const TYPE_LABEL: Record<TicketType, string> = {
  story: 'User story',
  bug: 'Bug',
  tech: 'Technique',
};

const STATUS_LABEL = {
  'pas-pret': 'Pas prêt',
  'presque-pret': 'Presque prêt',
  pret: 'Prêt à développer',
} as const;

const STATUS_STYLE = {
  'pas-pret': 'border-red-200 bg-red-50 text-red-700',
  'presque-pret': 'border-amber-200 bg-amber-50 text-amber-700',
  pret: 'border-green-200 bg-green-50 text-green-700',
} as const;

interface TicketPanelProps {
  ticket: Ticket;
  view: AtelierView;
}

// Panneau du ticket, toujours visible : le contenu, les précisions de l'atelier, et le statut recalculé.
export function TicketPanel({ ticket, view }: TicketPanelProps) {
  const blockerWord = view.blockers > 1 ? 'bloquants' : 'bloquant';
  const recoWord = view.recommendations > 1 ? 'recommandations' : 'recommandation';

  return (
    <section
      aria-labelledby="ticket-panel-title"
      className="flex flex-col gap-5 rounded-[14px] border p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">Ticket</span>
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant="outline" className={cn('font-medium', STATUS_STYLE[view.status])}>
            {STATUS_LABEL[view.status]}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {view.blockers} {blockerWord} · {view.recommendations} {recoWord}
          </span>
        </div>
      </div>

      <Link
        to="/atelier"
        search={{ vue: 'diagnostic' }}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'self-start')}
      >
        Voir le détail
      </Link>

      <div className="flex flex-col gap-2">
        <h2 id="ticket-panel-title" className="text-lg leading-snug font-semibold">
          {ticket.title}
        </h2>
        <Badge variant="secondary" className="self-start">
          {TYPE_LABEL[ticket.type]}
        </Badge>
      </div>

      <TicketField label="Contexte" text={ticket.context} />
      <TicketField label="Description" text={ticket.description} />

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">Critères d’acceptation</h3>
        {ticket.scenarios.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun scénario pour l’instant.</p>
        ) : (
          ticket.scenarios.map((scenario, index) => (
            <dl
              key={index}
              className="grid grid-cols-[52px_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-[10px] border p-3 text-sm"
            >
              <dt className="font-mono font-medium">Given</dt>
              <dd>{scenario.given}</dd>
              <dt className="font-mono font-medium">When</dt>
              <dd>{scenario.when}</dd>
              <dt className="font-mono font-medium">Then</dt>
              <dd>{scenario.then}</dd>
            </dl>
          ))
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">Précisions</h3>
        {view.precisions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune précision pour l’instant.</p>
        ) : (
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm">
            {view.precisions.map((precision) => (
              <li key={precision.suggestionId}>
                <span className="font-medium">{precision.label}</span> : {precision.text}
              </li>
            ))}
          </ul>
        )}
      </div>

      {view.openQuestions.map((question) => (
        <div
          key={question.suggestionId}
          className="flex items-start gap-2 rounded-[10px] border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          <CircleHelp className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            <span className="font-medium">Question ouverte</span> : {question.title}
          </span>
        </div>
      ))}
    </section>
  );
}

function TicketField({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-sm font-semibold">{label}</h3>
      <p className={cn('text-sm', text ? 'text-foreground/80' : 'text-muted-foreground')}>
        {text || 'Vide'}
      </p>
    </div>
  );
}
