import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const Route = createFileRoute('/diagnostic')({
  staticData: { breadcrumb: 'Diagnostic' },
  component: DiagnosticPage,
});

function DiagnosticPage() {
  return <PlaceholderPage title="Diagnostic du ticket" />;
}
