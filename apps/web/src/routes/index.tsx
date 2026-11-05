import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { healthQueryOptions } from '../api/health';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { data, error, isError, isPending } = useQuery(healthQueryOptions());

  return (
    <main>
      <h1>Ticket Studio</h1>
      {isPending && <p>Vérification de l'API…</p>}
      {isError && <p>API ou base de données indisponible : {error.message}</p>}
      {data && (
        <p>
          {data.status === 'ok'
            ? 'API et base de données opérationnelles'
            : 'Base de données indisponible'}
        </p>
      )}
    </main>
  );
}
