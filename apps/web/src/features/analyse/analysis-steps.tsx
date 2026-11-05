import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisStep } from './use-analysis-stream';

interface AnalysisStepsProps {
  steps: AnalysisStep[];
}

// Liste des étapes de l'analyse : coche pour les étapes terminées, spinner pour l'étape en cours.
export function AnalysisSteps({ steps }: AnalysisStepsProps) {
  return (
    <ol aria-live="polite" className="flex flex-col gap-4">
      {steps.map((step) => (
        <li key={step.id} className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0">
            {step.status === 'done' && (
              <CheckCircle2 className="size-[18px] text-green-600" aria-hidden="true" />
            )}
            {step.status === 'running' && (
              <Loader2 className="size-[18px] animate-spin" aria-hidden="true" />
            )}
            {step.status === 'pending' && (
              <Circle className="size-4 text-muted-foreground/50" aria-hidden="true" />
            )}
          </span>
          <span className="flex flex-col gap-0.5">
            <span
              className={cn('font-medium', step.status === 'pending' && 'text-muted-foreground/70')}
            >
              {step.label}
            </span>
            {step.status === 'done' && step.detail && (
              <span className="text-sm text-muted-foreground">{step.detail}</span>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}
