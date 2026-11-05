import type { CommitSummary } from '@ticket-studio/shared';
import { GitCommitHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCommitDate } from '@/lib/format-commit-date';

interface CommitsCardProps {
  branch: string;
  commits: CommitSummary[];
}

export function CommitsCard({ branch, commits }: CommitsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GitCommitHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />
          Derniers commits
        </CardTitle>
        <CardDescription>Branche {branch}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {commits.length === 0 ? (
          <p className="px-6 pb-6 text-muted-foreground">Aucun commit trouvé.</p>
        ) : (
          <ol className="divide-y border-t">
            {commits.map((commit) => (
              <li key={commit.shortSha} className="flex items-start gap-3.5 px-6 py-3">
                <Badge variant="outline" className="shrink-0 font-mono text-xs">
                  {commit.shortSha}
                </Badge>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium">{commit.subject}</span>
                  <span className="text-sm text-muted-foreground">
                    {commit.author} · {formatCommitDate(commit.date)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
