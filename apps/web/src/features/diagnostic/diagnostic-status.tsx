import type { DiagnosticStatus } from '@ticket-studio/shared';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const LEVELS: { status: DiagnosticStatus; label: string }[] = [
  { status: 'pas-pret', label: 'Pas prêt' },
  { status: 'presque-pret', label: 'Presque prêt' },
  { status: 'pret', label: 'Prêt à développer' },
];

const TONES: Record<DiagnosticStatus, { box: string; text: string; bar: string }> = {
  'pas-pret': { box: 'border-red-200 bg-red-50', text: 'text-red-700', bar: 'bg-red-600' },
  'presque-pret': {
    box: 'border-amber-200 bg-amber-50',
    text: 'text-amber-700',
    bar: 'bg-amber-600',
  },
  pret: { box: 'border-green-200 bg-green-50', text: 'text-green-700', bar: 'bg-green-600' },
};

interface DiagnosticStatusProps {
  status: DiagnosticStatus;
  blockers: number;
  recommendations: number;
  summary: string;
}

// Bandeau de statut : niveau atteint sur une jauge en trois étapes, compteurs et résumé.
export function DiagnosticStatus({
  status,
  blockers,
  recommendations,
  summary,
}: DiagnosticStatusProps) {
  const currentIndex = LEVELS.findIndex((level) => level.status === status);
  const tone = TONES[status];
  const StatusIcon =
    status === 'pas-pret' ? XCircle : status === 'pret' ? CheckCircle2 : AlertTriangle;

  return (
    <section className={cn('flex flex-col gap-4 rounded-[14px] border p-5', tone.box)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={cn('flex items-center gap-2 text-lg font-semibold', tone.text)}>
          <StatusIcon className="size-5" aria-hidden="true" />
          <span>{LEVELS[currentIndex]?.label}</span>
        </div>
        <div className="flex flex-wrap gap-2 text-sm font-medium">
          <span className="rounded-md border border-current/20 bg-background px-2 py-0.5">
            {blockers} {blockers > 1 ? 'bloquants' : 'bloquant'}
          </span>
          <span className="rounded-md border border-current/20 bg-background px-2 py-0.5">
            {recommendations} {recommendations > 1 ? 'recommandations' : 'recommandation'}
          </span>
        </div>
      </div>

      <p className="text-foreground/80">{summary}</p>

      <ol aria-label="Niveaux de préparation" className="grid grid-cols-3 gap-3">
        {LEVELS.map((level, index) => {
          const reached = index <= currentIndex;
          return (
            <li
              key={level.status}
              aria-current={index === currentIndex ? 'step' : undefined}
              className="flex flex-col gap-1.5"
            >
              <span className={cn('h-1.5 rounded-full', reached ? tone.bar : 'bg-border')} />
              <span
                className={cn(
                  'text-sm',
                  index === currentIndex ? 'font-semibold' : 'text-muted-foreground',
                )}
              >
                {level.label}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
