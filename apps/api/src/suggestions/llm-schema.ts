import {
  SuggestionImportanceSchema,
  SuggestionKindSchema,
  type Ticket,
} from '@ticket-studio/shared';
import { z } from 'zod';

const KIND_ALIASES: Record<string, string> = {
  reutiliser: 'reutiliser',
  'reutiliser-l-existant': 'reutiliser',
  preciser: 'preciser',
  'a-preciser': 'preciser',
  oubli: 'oubli',
  'point-oublie': 'oubli',
  'cas-limite': 'cas-limite',
};

const IMPORTANCES = SuggestionImportanceSchema.options;

// Libellés de type que le modèle peut renvoyer (sans accent, en minuscules, séparés par des tirets).
function normalizeKind(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const key = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]+/g, '-')
    .replace(/^-|-$/g, '');
  return KIND_ALIASES[key] ?? value;
}

// Une importance inconnue est ramenée à « moyenne » plutôt que de rejeter toute la réponse.
function normalizeImportance(value: unknown): string {
  return typeof value === 'string' && (IMPORTANCES as readonly string[]).includes(value)
    ? value
    : 'moyenne';
}

// Réponse brute du LLM. Les contrôles de fond (sources lues, filtre anti-code, nombre de réponses)
// sont faits ensuite dans verifySuggestions, suggestion par suggestion.
export const LlmSuggestionsSchema = z.object({
  suggestions: z
    .array(
      z.object({
        kind: z.preprocess(normalizeKind, SuggestionKindSchema),
        importance: z.preprocess(normalizeImportance, SuggestionImportanceSchema),
        title: z.string().trim(),
        body: z.string().trim(),
        sourceLabel: z.string().trim(),
        sourcePath: z.string().trim(),
        answers: z.array(z.string().trim()),
      }),
    )
    .nullish()
    .transform((value) => value ?? []),
});

export type LlmSuggestions = z.infer<typeof LlmSuggestionsSchema>;

// Prompt des suggestions : les quatre types de la maquette et le format exact attendu.
export function buildSuggestionsPrompt(ticket: Ticket): string {
  const scenarios =
    ticket.scenarios.length === 0
      ? '(aucun scénario)'
      : ticket.scenarios
          .map(
            (scenario) =>
              `- Given ${scenario.given} / When ${scenario.when} / Then ${scenario.then}`,
          )
          .join('\n');

  return [
    'Ticket saisi par le chef de produit :',
    `- Titre : ${ticket.title}`,
    `- Contexte : ${ticket.context || '(vide)'}`,
    `- Description : ${ticket.description || '(vide)'}`,
    `- Scénarios :\n${scenarios}`,
    '',
    'Propose jusqu’à 8 suggestions, de quatre types :',
    '- "reutiliser" : un écran ou un comportement existant proche, à reprendre pour ce ticket.',
    '- "preciser" : un terme ou une règle du ticket à préciser.',
    '- "oubli" : un point oublié (un autre écran, un canal, un service qui utilise la même donnée).',
    '- "cas-limite" : un cas particulier ou une évolution récente qui touche le besoin.',
    '',
    'Règles :',
    '- Utilise les outils. Ne cite comme source qu’un fichier que tu as lu.',
    '- "sourceLabel" est un libellé lisible par un chef de produit, par exemple « Écran Mes paniers sauvegardés ». Pas de nom de fichier dans ce libellé.',
    '- "title" et "body" sont en langage produit : une question courte posée au chef de produit. Aucun code, aucun nom de fichier, de route, de table ou d’endpoint.',
    '- "answers" : 2 ou 3 réponses courtes possibles.',
    '- "importance" : "haute", "moyenne" ou "basse".',
    '',
    'Format exact de la réponse :',
    '{"suggestions":[{"kind":"reutiliser","importance":"haute","title":"…","body":"…","sourceLabel":"Écran …","sourcePath":"chemin/du/fichier.tsx","answers":["…","…"]}]}',
    'Si tu n’as rien à suggérer, réponds {"suggestions":[]}.',
  ].join('\n');
}
