import type { Endpoint } from '@ticket-studio/shared';
import { Braces, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EndpointMethodBadge } from './endpoint-method-badge';
import { filterEndpoints } from './filter-endpoints';

interface EndpointsCardProps {
  endpoints: Endpoint[];
  filter: string;
  onFilterChange: (value: string) => void;
}

export function EndpointsCard({ endpoints, filter, onFilterChange }: EndpointsCardProps) {
  const visible = filterEndpoints(endpoints, filter);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3.5">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Braces className="size-4 text-muted-foreground" aria-hidden="true" />
            Endpoints
          </CardTitle>
          <Badge variant="secondary">{endpoints.length}</Badge>
        </div>
        <div className="relative">
          <Search
            className="absolute top-2.5 left-2.5 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Filtrer les endpoints"
            placeholder="Filtrer : orders, cart…"
            value={filter}
            onChange={(event) => onFilterChange(event.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>

      {endpoints.length === 0 ? (
        <p className="border-t px-6 py-6 text-muted-foreground">
          Aucun endpoint détecté dans le dépôt.
        </p>
      ) : visible.length === 0 ? (
        <p className="border-t px-6 py-6 text-muted-foreground">
          Aucun endpoint ne correspond au filtre.
        </p>
      ) : (
        <div className="overflow-x-auto border-t">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24 px-6">Méthode</TableHead>
                <TableHead>Chemin</TableHead>
                <TableHead className="pr-6">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((endpoint) => (
                <TableRow key={`${endpoint.method} ${endpoint.path} ${endpoint.source}`}>
                  <TableCell className="px-6">
                    <EndpointMethodBadge method={endpoint.method} />
                  </TableCell>
                  <TableCell className="font-mono text-[13px]">{endpoint.path}</TableCell>
                  <TableCell className="pr-6 text-muted-foreground">{endpoint.source}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="border-t px-6 py-3 text-sm text-muted-foreground">
        {visible.length} sur {endpoints.length}
      </p>
    </Card>
  );
}
