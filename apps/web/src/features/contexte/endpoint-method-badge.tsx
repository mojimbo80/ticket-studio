import type { HttpMethod } from '@ticket-studio/shared';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Couleur par méthode HTTP, comme dans la maquette.
const METHOD_STYLES: Record<HttpMethod, string> = {
  GET: 'border-green-200 bg-green-50 text-green-700',
  POST: 'border-blue-200 bg-blue-50 text-blue-700',
  PUT: 'border-amber-200 bg-amber-50 text-amber-700',
  PATCH: 'border-amber-200 bg-amber-50 text-amber-700',
  DELETE: 'border-red-200 bg-red-50 text-red-700',
};

interface EndpointMethodBadgeProps {
  method: HttpMethod;
}

export function EndpointMethodBadge({ method }: EndpointMethodBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('min-w-12 justify-center font-mono text-xs', METHOD_STYLES[method])}
    >
      {method}
    </Badge>
  );
}
