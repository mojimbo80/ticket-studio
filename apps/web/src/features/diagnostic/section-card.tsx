import { Link } from '@tanstack/react-router';
import type { Issue, Proposal, TicketSection, TicketSectionKey } from '@ticket-studio/shared';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SECTION_TEXT: Record<TicketSectionKey, { name: string; sub: string }> = {
  title: { name: 'Titre', sub: 'Une phrase claire, du point de vue de l’utilisateur' },
  context: { name: 'Contexte', sub: 'Le pourquoi' },
  description: { name: 'Description', sub: 'Le quoi, sous forme de user story' },
  criteria: { name: 'Critères d’acceptation', sub: 'Given / When / Then' },
};

interface SectionCardProps {
  section: TicketSection;
  issues: Issue[];
  proposal: Proposal | undefined;
  onAccept: (proposal: Proposal) => void;
}

// Une section du ticket : son état, les points qui la concernent, et la proposition de l'agent si elle est vide.
export function SectionCard({ section, issues, proposal, onAccept }: SectionCardProps) {
  const text = SECTION_TEXT[section.key];
  // Une section vide est déjà signalée par son badge : seuls les autres bloquants sont listés.
  const blockers = issues.filter(
    (issue) => issue.severity === 'bloquant' && issue.kind !== 'section-vide',
  );
  const recommendations = issues.filter((issue) => issue.severity === 'recommandation');

  return (
    <article className="flex flex-col gap-4 rounded-[14px] border p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-semibold">{text.name}</h3>
          <p className="text-sm text-muted-foreground">{text.sub}</p>
        </div>
        <StatusBadge filled={section.filled} />
      </div>

      {blockers.map((issue) => (
        <div
          key={issue.id}
          role="alert"
          className="flex items-start gap-2 rounded-[10px] border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>Bloquant : {issue.message}</span>
        </div>
      ))}

      {!section.filled && proposal && <ProposalBlock proposal={proposal} />}

      {recommendations.length > 0 && (
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
          {recommendations.map((issue) => (
            <li key={issue.id}>{issue.message}</li>
          ))}
        </ul>
      )}

      {!section.filled && (
        <div className="flex flex-wrap gap-2">
          {proposal && (
            <Button size="sm" onClick={() => onAccept(proposal)}>
              {proposal.sectionKey === 'criteria' ? 'Accepter le scénario' : 'Accepter'}
            </Button>
          )}
          <Link to="/saisie" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Modifier
          </Link>
        </div>
      )}
    </article>
  );
}

function StatusBadge({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
        Complété
      </Badge>
    );
  }
  return <Badge className={cn('bg-red-600 text-white hover:bg-red-600')}>Vide · bloquant</Badge>;
}

// Proposition de l'agent, avec un avertissement si elle suppose une information non vérifiée.
function ProposalBlock({ proposal }: { proposal: Proposal }) {
  return (
    <div className="flex flex-col gap-3 rounded-[10px] border bg-muted/40 p-4">
      <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Sparkles className="size-3.5" aria-hidden="true" />
        Proposition de l’agent
      </span>

      {proposal.scenario ? (
        <dl className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm">
          <dt className="font-mono font-medium">Given</dt>
          <dd>{proposal.scenario.given}</dd>
          <dt className="font-mono font-medium">When</dt>
          <dd>{proposal.scenario.when}</dd>
          <dt className="font-mono font-medium">Then</dt>
          <dd>{proposal.scenario.then}</dd>
        </dl>
      ) : (
        <p>{proposal.text}</p>
      )}

      {proposal.assumption && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          À vérifier : {proposal.assumption}
        </p>
      )}

      {proposal.sources.length > 0 && (
        <p className="text-xs text-muted-foreground">Sources : {proposal.sources.join(', ')}</p>
      )}
    </div>
  );
}
