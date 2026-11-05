import { z } from 'zod';

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

export const TicketSectionSchema = z.object({
  key: z.enum(['title', 'context', 'description', 'criteria']),
  label: z.string(),
  filled: z.boolean(),
});

export const SuggestionSchema = z.object({
  id: z.string(),
  severity: z.enum(['bloquant', 'recommandation']),
  text: z.string(),
  source: z.string(),
});

export const DiagnosticSchema = z.object({
  status: z.enum(['pas-pret', 'presque-pret', 'pret']),
  blockers: z.number().int().min(0),
  recommendations: z.number().int().min(0),
  sections: z.array(TicketSectionSchema),
  suggestions: z.array(SuggestionSchema),
});

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
export type TicketSection = z.infer<typeof TicketSectionSchema>;
export type Suggestion = z.infer<typeof SuggestionSchema>;
export type Diagnostic = z.infer<typeof DiagnosticSchema>;
export type AnalysisEvent = z.infer<typeof AnalysisEventSchema>;
