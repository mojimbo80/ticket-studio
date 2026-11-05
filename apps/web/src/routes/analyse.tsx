import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/components/layout/placeholder-page';

export const Route = createFileRoute('/analyse')({
  staticData: { breadcrumb: 'Analyse' },
  component: AnalysePage,
});

function AnalysePage() {
  return <PlaceholderPage title="Analyse du projet" />;
}
