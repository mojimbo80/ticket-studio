import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/components/layout/placeholder-page';
import { requireTicketTitle } from '@/lib/ticket-guard';

export const Route = createFileRoute('/atelier')({
  beforeLoad: () => requireTicketTitle(),
  staticData: { breadcrumb: 'Atelier' },
  component: AtelierPage,
});

function AtelierPage() {
  return <PlaceholderPage title="Atelier" />;
}
