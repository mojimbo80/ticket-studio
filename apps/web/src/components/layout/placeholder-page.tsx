import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PlaceholderPageProps {
  title: string;
}

// Écran dont la construction est prévue dans une étape ultérieure.
export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <main className="mx-auto w-full max-w-[1240px] px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Cet écran sera construit à l'étape suivante.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </main>
  );
}
