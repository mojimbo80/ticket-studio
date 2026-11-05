import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const Route = createFileRoute('/saisie')({
  staticData: { breadcrumb: 'Saisie' },
  component: SaisiePage,
});

function SaisiePage() {
  return <PlaceholderPage title="Saisie du ticket" />;
}
