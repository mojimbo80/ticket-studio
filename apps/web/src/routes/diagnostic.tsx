import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/components/layout/placeholder-page';
import { requireTicketTitle } from '@/lib/ticket-guard';

export const Route = createFileRoute('/diagnostic')({
  beforeLoad: () => requireTicketTitle(),
  staticData: { breadcrumb: 'Diagnostic' },
  component: DiagnosticPage,
});

function DiagnosticPage() {
  return <PlaceholderPage title="Diagnostic du ticket" />;
}
