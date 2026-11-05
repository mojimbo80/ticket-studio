import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    // TanStack Router attend un objet redirect levé, et non une Error.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: '/saisie' });
  },
});
