import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReadmeSummaryCardProps {
  summary: string | null;
}

export function ReadmeSummaryCard({ summary }: ReadmeSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
          Résumé du README
        </CardTitle>
      </CardHeader>
      <CardContent>
        {summary ? (
          <p className="text-foreground/80">{summary}</p>
        ) : (
          <p className="text-muted-foreground">Aucun README trouvé à la racine du dépôt.</p>
        )}
      </CardContent>
    </Card>
  );
}
