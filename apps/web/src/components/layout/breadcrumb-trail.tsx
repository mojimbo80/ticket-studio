import { useMatches } from '@tanstack/react-router';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Fil d'Ariane calculé à partir des routes actives : chaque route déclare son libellé dans staticData.
export function BreadcrumbTrail() {
  const labels = useMatches({
    select: (matches) =>
      matches.flatMap((match) =>
        match.staticData.breadcrumb ? [match.staticData.breadcrumb] : [],
      ),
  });

  if (labels.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {labels.map((label, index) => (
          <BreadcrumbItem key={`${label}-${index}`}>
            {index > 0 && <BreadcrumbSeparator />}
            {index === labels.length - 1 ? (
              <BreadcrumbPage>{label}</BreadcrumbPage>
            ) : (
              <span className="text-muted-foreground">{label}</span>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
