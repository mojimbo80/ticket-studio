import type { Suggestion, SuggestionKind } from '@ticket-studio/shared';
import { BookOpen, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SuggestionResolution } from './atelier-store';

const KIND_LABEL: Record<SuggestionKind, string> = {
  reutiliser: 'Réutiliser l’existant',
  preciser: 'À préciser',
  oubli: 'Point oublié',
  'cas-limite': 'Cas limite',
};

const KIND_STYLE: Record<SuggestionKind, string> = {
  reutiliser: 'border-transparent bg-foreground text-background',
  preciser: 'border-transparent bg-muted text-foreground',
  oubli: 'border-border bg-background text-foreground',
  'cas-limite': 'border-amber-200 bg-amber-50 text-amber-800',
};

interface SuggestionCardProps {
  suggestion: Suggestion;
  resolution: SuggestionResolution | undefined;
  onAnswer: (answer: string) => void;
  onIgnore: () => void;
  onReopen: () => void;
}

// Une suggestion : son type, sa source lisible, la question, puis les réponses ou l'état ignoré.
export function SuggestionCard({
  suggestion,
  resolution,
  onAnswer,
  onIgnore,
  onReopen,
}: SuggestionCardProps) {
  const open = resolution === undefined;

  return (
    <article
      className={cn(
        'flex flex-col gap-3 rounded-[12px] bg-background p-4',
        open ? 'border border-foreground shadow-sm' : 'border',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={cn('font-medium', KIND_STYLE[suggestion.kind])}>
          {KIND_LABEL[suggestion.kind]}
        </Badge>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <BookOpen className="size-3.5" aria-hidden="true" />
          {suggestion.sourceLabel}
        </span>
      </div>

      <p className="font-medium">{suggestion.title}</p>

      {open && (
        <>
          <p className="text-sm text-foreground/80">{suggestion.body}</p>
          <div className="flex flex-wrap gap-2">
            {suggestion.answers.map((answer) => (
              <Button key={answer} variant="outline" size="sm" onClick={() => onAnswer(answer)}>
                {answer}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={onIgnore}>
              Ignorer
            </Button>
          </div>
        </>
      )}

      {resolution?.status === 'answered' && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2 font-medium">
            <Check className="size-4 text-green-600" aria-hidden="true" />
            {resolution.answer}
          </span>
          <Button variant="ghost" size="sm" onClick={onReopen}>
            Modifier
          </Button>
        </div>
      )}

      {resolution?.status === 'ignored' && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>Ignorée</span>
          <Button variant="ghost" size="sm" onClick={onReopen}>
            Rouvrir
          </Button>
        </div>
      )}
    </article>
  );
}
