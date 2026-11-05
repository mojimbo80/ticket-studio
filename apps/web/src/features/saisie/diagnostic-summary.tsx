import { getTicketSections } from '@ticket-studio/shared';
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { SAISIE_FORM_ID } from './saisie-form';
import { hasTicketTitle, useTicketStore } from './ticket-store';

// Encart « Avant le diagnostic » : progression des sections et lancement de l'analyse.
export function DiagnosticSummary() {
  const ticket = useTicketStore((state) => state.ticket);
  const sections = getTicketSections(ticket);
  const filledCount = sections.filter((section) => section.filled).length;
  const canLaunch = hasTicketTitle(ticket);

  return (
    <Card className="sticky top-6 w-full flex-[1_1_300px] gap-5 self-start p-6 shadow-xs md:w-auto">
      <CardHeader className="gap-1.5 p-0">
        <CardTitle className="text-base">Avant le diagnostic</CardTitle>
        <CardDescription>L'agent proposera les sections vides.</CardDescription>
      </CardHeader>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Sections remplies</span>
          <span className="font-medium">
            {filledCount} / {sections.length}
          </span>
        </div>
        <Progress value={(filledCount / sections.length) * 100} />
      </div>

      <ul className="flex flex-col gap-2.5 text-sm">
        {sections.map((section) => (
          <li
            key={section.key}
            className={cn('flex items-center gap-2', !section.filled && 'text-muted-foreground')}
          >
            {section.filled ? (
              <CheckCircle2 className="size-4 text-green-600" aria-hidden="true" />
            ) : (
              <Circle className="size-4 text-muted-foreground/60" aria-hidden="true" />
            )}
            {section.label}
            {section.key === 'title' && (
              <span className="text-muted-foreground">· obligatoire</span>
            )}
          </li>
        ))}
      </ul>

      <Button type="submit" form={SAISIE_FORM_ID} disabled={!canLaunch} className="h-10 w-full">
        Lancer le diagnostic
        <ArrowRight aria-hidden="true" />
      </Button>
    </Card>
  );
}
