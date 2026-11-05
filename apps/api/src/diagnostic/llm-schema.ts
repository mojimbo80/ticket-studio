import { ScenarioSchema, type Ticket, type TicketSection } from '@ticket-studio/shared';
import { z } from 'zod';

// Libellés courants que le modèle peut renvoyer à la place des clés attendues (sans accent, en minuscules).
const SECTION_KEY_ALIASES: Record<string, 'context' | 'description' | 'criteria'> = {
  context: 'context',
  contexte: 'context',
  description: 'description',
  criteria: 'criteria',
  critere: 'criteria',
  criteres: 'criteria',
  'criteres d acceptation': 'criteria',
};

function normalizeSectionKey(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const key = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/\s+/g, ' ');
  return SECTION_KEY_ALIASES[key] ?? value;
}

// Réponse attendue du LLM : des propositions et des termes ambigus. Le statut n'en fait pas partie.
// Les champs optionnels reçoivent une valeur par défaut : une source absente signifie « aucune ».
export const LlmDiagnosisSchema = z.object({
  proposals: z
    .array(
      z.object({
        sectionKey: z.preprocess(
          normalizeSectionKey,
          z.enum(['context', 'description', 'criteria']),
        ),
        text: z.string().trim().min(1),
        scenario: ScenarioSchema.nullish().transform((value) => value ?? null),
        assumption: z
          .string()
          .nullish()
          .transform((value) => value ?? null),
        sources: z
          .array(z.string())
          .nullish()
          .transform((value) => value ?? []),
      }),
    )
    .nullish()
    .transform((value) => value ?? []),
  ambiguousTerms: z
    .array(
      z.object({
        term: z.string(),
        reason: z.string(),
      }),
    )
    .nullish()
    .transform((value) => value ?? []),
});

export type LlmDiagnosis = z.infer<typeof LlmDiagnosisSchema>;

// Prompt du diagnostic. Les règles de CLAUDE.md sont rappelées dans le prompt système commun.
export function buildDiagnosisPrompt(ticket: Ticket, emptySections: TicketSection[]): string {
  const scenarios =
    ticket.scenarios.length === 0
      ? '(aucun scénario)'
      : ticket.scenarios
          .map(
            (scenario, index) =>
              `  ${index + 1}. Given ${scenario.given} / When ${scenario.when} / Then ${scenario.then}`,
          )
          .join('\n');

  const sectionsToPropose =
    emptySections.length === 0
      ? 'Aucune section vide : "proposals" doit être une liste vide.'
      : emptySections.map((section) => `- "${section.key}" (${section.label})`).join('\n');

  return [
    'Ticket saisi par le chef de produit :',
    `- Titre : ${ticket.title}`,
    `- Contexte : ${ticket.context || '(vide)'}`,
    `- Description : ${ticket.description || '(vide)'}`,
    `- Scénarios :\n${scenarios}`,
    '',
    'Sections vides à proposer (utilise exactement ces clés) :',
    sectionsToPropose,
    '',
    'Tâches :',
    '1. Pour chaque section vide, rédige une proposition en langage produit, à partir du titre et du projet. Utilise les outils pour te baser sur le code. Pour "criteria", donne aussi un scénario { given, when, then }.',
    '2. Si tu dois supposer une information que tu ne peux pas vérifier dans le projet (un chiffre, une décision métier), écris-la dans "assumption". Sinon, mets null.',
    '3. Dans "sources", cite uniquement les chemins de fichiers que tu as lus avec un outil. Si tu n\'en as lu aucun, mets [].',
    '4. Relève les termes ambigus du ticket, qui peuvent désigner plusieurs réalités (par exemple « terminées »). Ne retiens que des mots qui apparaissent dans le ticket, avec une raison courte.',
    '',
    'Format exact de la réponse :',
    '{"proposals":[{"sectionKey":"context","text":"…","scenario":null,"assumption":null,"sources":[]}],"ambiguousTerms":[{"term":"…","reason":"…"}]}',
    'Pour une section "criteria", "scenario" est un objet {"given":"…","when":"…","then":"…"} et "text" en résume le sens.',
  ].join('\n');
}
