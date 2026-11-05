import type { Suggestion, SuggestionImportance } from '@ticket-studio/shared';
import type { LlmSuggestions } from './llm-schema';
import { containsTechnicalText } from './technical-text';

export const MAX_SUGGESTIONS = 8;
const MAX_ANSWERS = 3;
const MIN_ANSWERS = 2;

// Suggestion vérifiée : le chemin source reste ici, côté serveur, et n'est pas renvoyé au client.
export type VerifiedSuggestion = Suggestion & { sourcePath: string };

const IMPORTANCE_RANK: Record<SuggestionImportance, number> = { haute: 0, moyenne: 1, basse: 2 };

// Écarte toute suggestion dont la source n'a pas été lue pendant la génération, ou dont le texte
// affiché contient du code ou un nom technique. Trie par importance et garde au maximum 8 suggestions.
export function verifySuggestions(
  raw: LlmSuggestions['suggestions'],
  readFiles: string[],
): VerifiedSuggestion[] {
  const readSet = new Set(readFiles.map(normalizePath));

  return raw
    .flatMap((item, index) => {
      const verified = verifyOne(item, index, readSet);
      return verified ? [verified] : [];
    })
    .sort((a, b) => IMPORTANCE_RANK[a.importance] - IMPORTANCE_RANK[b.importance])
    .slice(0, MAX_SUGGESTIONS);
}

function verifyOne(
  item: LlmSuggestions['suggestions'][number],
  index: number,
  readSet: Set<string>,
): VerifiedSuggestion | null {
  // Une source absente du journal de lecture n'existe pas, ou n'a pas été lue par un outil.
  if (!readSet.has(normalizePath(item.sourcePath))) {
    return null;
  }
  if (item.title === '' || item.body === '' || item.sourceLabel === '') {
    return null;
  }

  const answers = [...new Set(item.answers.filter((answer) => answer !== ''))].slice(
    0,
    MAX_ANSWERS,
  );
  if (answers.length < MIN_ANSWERS) {
    return null;
  }

  const visibleTexts = [item.title, item.body, item.sourceLabel, ...answers];
  if (visibleTexts.some(containsTechnicalText)) {
    return null;
  }

  return {
    id: `suggestion-${index + 1}`,
    kind: item.kind,
    importance: item.importance,
    title: item.title,
    body: item.body,
    sourceLabel: item.sourceLabel,
    answers,
    sourcePath: normalizePath(item.sourcePath),
  };
}

// Même forme que les chemins du journal de lecture : séparateurs « / », sans « ./ » initial.
function normalizePath(path: string): string {
  return path.trim().replace(/\\/g, '/').replace(/^\.\//, '');
}
