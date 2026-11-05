import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const Route = createFileRoute('/atelier')({
  staticData: { breadcrumb: 'Atelier' },
  component: AtelierPage,
});

function AtelierPage() {
  return <PlaceholderPage title="Atelier" />;
}
