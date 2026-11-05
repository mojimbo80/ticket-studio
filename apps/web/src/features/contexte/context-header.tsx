import { Link } from '@tanstack/react-router';
import type { ProjectContext } from '@ticket-studio/shared';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { useReindexProject } from './use-reindex-project';

interface ContextHeaderProps {
  repo: ProjectContext['repo'];
}

export function ContextHeader({ repo }: ContextHeaderProps) {
  const reindex = useReindexProject();

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <p className="text-muted-foreground">Ce que l'agent sait du projet</p>
        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold tracking-tight">
          <span className="font-mono font-medium">{repo.name}</span>
          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
            Analysé · branche {repo.branch}
          </Badge>
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/atelier" className={buttonVariants({ variant: 'outline' })}>
          <ArrowLeft aria-hidden="true" />
          Retour à l'atelier
        </Link>
        <Button onClick={() => reindex.mutate()} disabled={reindex.isPending}>
          <RefreshCw
            className={reindex.isPending ? 'animate-spin' : undefined}
            aria-hidden="true"
          />
          Ré-analyser
        </Button>
      </div>
    </div>
  );
}
