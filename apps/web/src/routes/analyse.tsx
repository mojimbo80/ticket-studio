import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/components/layout/placeholder-page';
import { requireTicketTitle } from '@/lib/ticket-guard';

export const Route = createFileRoute('/analyse')({
  beforeLoad: () => requireTicketTitle(),
  staticData: { breadcrumb: 'Analyse' },
  component: AnalysePage,
});

function AnalysePage() {
  return <PlaceholderPage title="Analyse du projet" />;
}
