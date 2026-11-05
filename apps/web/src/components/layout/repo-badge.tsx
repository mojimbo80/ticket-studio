import { useQuery } from '@tanstack/react-query';
import { GitBranch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { projectContextQueryOptions } from '@/queries/project';

// Nom du dépôt analysé et branche suivie, affichés dans l'en-tête.
export function RepoBadge() {
  const { data, isPending, isError } = useQuery(projectContextQueryOptions());

  if (isPending) {
    return <Skeleton className="h-6 w-40" />;
  }
  if (isError) {
    return <Badge variant="destructive">Dépôt indisponible</Badge>;
  }

  return (
    <Badge variant="outline" className="h-6 gap-1.5 font-mono text-xs">
      <GitBranch className="size-3.5" aria-hidden="true" />
      {data.repo.name}
      <span className="text-muted-foreground">· {data.repo.branch}</span>
    </Badge>
  );
}
