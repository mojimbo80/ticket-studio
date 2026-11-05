import type { Suggestion } from '@ticket-studio/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/get-error-message';
import { useAtelierStore } from './atelier-store';
import { SuggestionCard } from './suggestion-card';

interface SuggestionsPanelProps {
  suggestions: Suggestion[] | undefined;
  isPending: boolean;
  error: unknown;
  onRetry: () => void;
}

// Liste des suggestions de l'agent. Les réponses sont gardées dans le store de l'atelier.
export function SuggestionsPanel({
  suggestions,
  isPending,
  error,
  onRetry,
}: SuggestionsPanelProps) {
  const resolutions = useAtelierStore((state) => state.resolutions);
  const answer = useAtelierStore((state) => state.answer);
  const ignore = useAtelierStore((state) => state.ignore);
  const reopen = useAtelierStore((state) => state.reopen);

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-[12px] border border-destructive/30 p-4">
        <p className="text-destructive">{getErrorMessage(error)}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return <p className="text-muted-foreground">L’agent n’a pas de suggestion pour ce ticket.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {suggestions.map((suggestion) => (
        <SuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          resolution={resolutions[suggestion.id]}
          onAnswer={(value) => answer(suggestion.id, value)}
          onIgnore={() => ignore(suggestion.id)}
          onReopen={() => reopen(suggestion.id)}
        />
      ))}
    </div>
  );
}
