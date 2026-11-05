import { SuggestionsResponseSchema } from '@ticket-studio/shared';
import { describe, expect, it } from 'vitest';
import type { LlmSuggestions } from './llm-schema';
import { MAX_SUGGESTIONS, verifySuggestions } from './verify';

type RawSuggestion = LlmSuggestions['suggestions'][number];

const READ = 'apps/web/src/features/paniers/paniers-sauvegardes.tsx';

function raw(overrides: Partial<RawSuggestion> = {}): RawSuggestion {
  return {
    kind: 'reutiliser',
    importance: 'moyenne',
    title: 'Un écran similaire existe déjà',
    body: 'Veux-tu le même rendu pour les commandes ?',
    sourceLabel: 'Écran Mes paniers sauvegardés',
    sourcePath: READ,
    answers: ['Oui, même rendu', 'Non, autre rendu'],
    ...overrides,
  };
}

describe('verifySuggestions : sources', () => {
  it("écarte une suggestion dont le fichier source n'a pas été lu", () => {
    const result = verifySuggestions([raw({ sourcePath: 'apps/web/src/inventé.tsx' })], [READ]);

    expect(result).toEqual([]);
  });

  it('garde une suggestion dont la source a été lue, avec son chemin côté serveur', () => {
    const result = verifySuggestions([raw({ sourcePath: `./${READ}` })], [READ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.sourcePath).toBe(READ);
  });

  it('ne renvoie pas le chemin source au client', () => {
    const verified = verifySuggestions([raw()], [READ]);

    const response = SuggestionsResponseSchema.parse({ suggestions: verified });

    expect(response.suggestions[0]).not.toHaveProperty('sourcePath');
    expect(response.suggestions[0]?.sourceLabel).toBe('Écran Mes paniers sauvegardés');
  });
});

describe('verifySuggestions : filtre anti-code', () => {
  it('écarte une suggestion dont le texte affiché contient un nom technique', () => {
    expect(
      verifySuggestions([raw({ body: 'Appeler getOrders avant l’affichage ?' })], [READ]),
    ).toEqual([]);
  });

  it('écarte une suggestion dont le libellé de source contient un chemin', () => {
    expect(verifySuggestions([raw({ sourceLabel: 'Écran src/paniers.tsx' })], [READ])).toEqual([]);
  });

  it('écarte une suggestion dont une réponse contient du code', () => {
    expect(
      verifySuggestions([raw({ answers: ['Oui', 'Filtrer avec `archived`'] })], [READ]),
    ).toEqual([]);
  });
});

describe('verifySuggestions : réponses et tri', () => {
  it('écarte une suggestion avec moins de deux réponses et limite à trois réponses', () => {
    expect(verifySuggestions([raw({ answers: ['Oui'] })], [READ])).toEqual([]);

    const [kept] = verifySuggestions([raw({ answers: ['A', 'B', 'C', 'D'] })], [READ]);
    expect(kept?.answers).toEqual(['A', 'B', 'C']);
  });

  it('trie par importance et garde au maximum huit suggestions', () => {
    const items = Array.from({ length: 10 }, (_, index) =>
      raw({
        importance: index % 3 === 0 ? 'basse' : index % 3 === 1 ? 'haute' : 'moyenne',
        title: `Suggestion ${index}`,
      }),
    );

    const result = verifySuggestions(items, [READ]);

    expect(result).toHaveLength(MAX_SUGGESTIONS);
    expect(result[0]?.importance).toBe('haute');
    const ranks = result.map(
      (suggestion) => ({ haute: 0, moyenne: 1, basse: 2 })[suggestion.importance],
    );
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
  });
});
