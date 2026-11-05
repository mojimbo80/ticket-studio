import { ListTodo } from 'lucide-react';
import { BreadcrumbTrail } from './breadcrumb-trail';
import { RepoBadge } from './repo-badge';

export function AppHeader() {
  return (
    <header className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b px-6 py-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ListTodo className="size-4" aria-hidden="true" />
          </span>
          <span className="text-[15px] font-semibold">Ticket Studio</span>
        </div>
        <BreadcrumbTrail />
      </div>
      <RepoBadge />
    </header>
  );
}
