import { useQueryClient } from '@tanstack/react-query';
import {
  ANALYSIS_STEPS,
  type AnalysisEvent,
  type AnalysisStepId,
  type Diagnostic,
  type Ticket,
} from '@ticket-studio/shared';
import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/get-error-message';
import { queryKeys } from '@/queries/keys';
import { streamAnalysis } from './stream-analysis';

export type StepStatus = 'pending' | 'running' | 'done';

export interface AnalysisStep {
  id: AnalysisStepId;
  label: string;
  status: StepStatus;
  detail?: string;
}

export interface AnalysisState {
  status: 'running' | 'done' | 'error';
  steps: AnalysisStep[];
  diagnostic: Diagnostic | null;
  errorMessage: string | null;
}

function initialState(): AnalysisState {
  return {
    status: 'running',
    steps: ANALYSIS_STEPS.map((step) => ({ id: step.id, label: step.label, status: 'pending' })),
    diagnostic: null,
    errorMessage: null,
  };
}

// Lance l'analyse du ticket au montage et annule le flux à la sortie de la page.
// Le diagnostic reçu est placé dans le cache pour Diagnostic et Atelier.
export function useAnalysisStream(ticket: Ticket) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AnalysisState>(initialState);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const applyEvent = (event: AnalysisEvent) => {
      if (controller.signal.aborted) {
        return;
      }
      if (event.type === 'progress') {
        setState((previous) => ({
          ...previous,
          steps: previous.steps.map((step) =>
            step.id === event.step ? { ...step, status: event.status, detail: event.detail } : step,
          ),
        }));
      } else if (event.type === 'done') {
        queryClient.setQueryData<Diagnostic>(queryKeys.analysis(), event.diagnostic);
        setState((previous) => ({
          ...previous,
          status: 'done',
          diagnostic: event.diagnostic,
        }));
      } else {
        setState((previous) => ({ ...previous, status: 'error', errorMessage: event.message }));
      }
    };

    streamAnalysis(ticket, controller.signal, applyEvent).catch((error: unknown) => {
      if (controller.signal.aborted) {
        return;
      }
      setState((previous) => ({
        ...previous,
        status: 'error',
        errorMessage: getErrorMessage(error),
      }));
    });

    return () => controller.abort();
  }, [attempt, ticket, queryClient]);

  const retry = useCallback(() => {
    setState(initialState());
    setAttempt((count) => count + 1);
  }, []);

  return { state, retry };
}
