import { z } from 'zod';
import { type Diagnostic, DiagnosticSchema } from './diagnostic';

// Étapes de l'analyse, dans l'ordre d'affichage. Les libellés sont ceux de la maquette.
export const ANALYSIS_STEPS = [
  { id: 'documentation', label: 'Lecture de la documentation du projet' },
  { id: 'donnees', label: 'Compréhension des données' },
  { id: 'evolutions', label: 'Historique des évolutions' },
  { id: 'ecrans', label: 'Recherche d’écrans et de comportements similaires' },
  { id: 'sections', label: 'Vérification des sections du ticket' },
] as const;

export const AnalysisStepIdSchema = z.enum([
  'documentation',
  'donnees',
  'evolutions',
  'ecrans',
  'sections',
]);

const ProgressEventSchema = z.object({
  type: z.literal('progress'),
  step: AnalysisStepIdSchema,
  status: z.enum(['running', 'done']),
  detail: z.string().optional(),
});

const DoneEventSchema = z.object({
  type: z.literal('done'),
  diagnostic: DiagnosticSchema,
});

const ErrorEventSchema = z.object({
  type: z.literal('error'),
  message: z.string(),
});

// Un événement du flux SSE de POST /api/analyze.
export const AnalysisEventSchema = z.discriminatedUnion('type', [
  ProgressEventSchema,
  DoneEventSchema,
  ErrorEventSchema,
]);

export type AnalysisStepId = z.infer<typeof AnalysisStepIdSchema>;
export type AnalysisEvent = z.infer<typeof AnalysisEventSchema>;
export type AnalysisDiagnostic = Diagnostic;
