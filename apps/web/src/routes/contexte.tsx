import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { ContextHeader } from '@/features/contexte/context-header';
import { ContextError, ContextPending } from '@/features/contexte/context-states';
import { CommitsCard } from '@/features/contexte/commits-card';
import { EndpointsCard } from '@/features/contexte/endpoints-card';
import { ReadmeSummaryCard } from '@/features/contexte/readme-summary-card';
import { projectContextQueryOptions } from '@/queries/project';

const contexteSearchSchema = z.object({
  q: z.string().catch(''),
});

export const Route = createFileRoute('/contexte')({
  staticData: { breadcrumb: 'Contexte du projet' },
  validateSearch: contexteSearchSchema,
  loader: ({ context }) => context.queryClient.ensureQueryData(projectContextQueryOptions()),
  pendingComponent: ContextPending,
  errorComponent: ContextError,
  component: ContextPage,
});

function ContextPage() {
  const { data: context } = useSuspenseQuery(projectContextQueryOptions());
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <main className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-6 py-10">
      <ContextHeader repo={context.repo} />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <ReadmeSummaryCard summary={context.readmeSummary} />
          <CommitsCard branch={context.repo.branch} commits={context.commits} />
        </div>
        <EndpointsCard
          endpoints={context.endpoints}
          filter={q}
          onFilterChange={(value) => void navigate({ search: { q: value }, replace: true })}
        />
      </div>
    </main>
  );
}
