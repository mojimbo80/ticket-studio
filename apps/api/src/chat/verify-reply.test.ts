import { describe, expect, it } from 'vitest';
import type { ChatReply } from './llm-schema';
import { verifyReply } from './verify-reply';

const READ = 'apps/web/src/features/paniers/paniers-sauvegardes.tsx';

function reply(overrides: Partial<ChatReply> = {}): ChatReply {
  return {
    message: 'Je propose de reprendre l’écran existant.',
    references: [{ label: 'Écran Mes paniers sauvegardés', sourcePath: READ }],
    quickReplies: ['Oui', 'Non'],
    patch: null,
    ...overrides,
  };
}

describe('verifyReply : références', () => {
  it('ne cite un écran que si son fichier a été lu', () => {
    const verified = verifyReply(
      reply({ references: [{ label: 'Écran inventé', sourcePath: 'apps/web/src/inventé.tsx' }] }),
      [READ],
    );

    expect(verified.references).toEqual([]);
  });

  it('garde le libellé d’un écran lu, sans le chemin', () => {
    const verified = verifyReply(reply(), [READ]);

    expect(verified.references).toEqual([{ label: 'Écran Mes paniers sauvegardés' }]);
  });

  it('écarte un libellé qui contient un nom technique', () => {
    const verified = verifyReply(
      reply({ references: [{ label: 'Écran src/paniers.tsx', sourcePath: READ }] }),
      [READ],
    );

    expect(verified.references).toEqual([]);
  });
});

describe('verifyReply : réponses rapides', () => {
  it('écarte une réponse rapide qui contient du code et limite à trois', () => {
    const verified = verifyReply(
      reply({ quickReplies: ['Oui', 'Filtrer avec `archived`', 'Non', 'Peut-être', 'Plus tard'] }),
      [READ],
    );

    expect(verified.quickReplies).toEqual(['Oui', 'Non', 'Peut-être']);
  });
});

describe('verifyReply : modification du ticket', () => {
  it('garde une modification propre', () => {
    const verified = verifyReply(
      reply({
        patch: {
          type: 'add-scenario',
          scenario: {
            given: 'une commande livrée',
            when: 'le client archive',
            then: 'elle part dans Archivées',
          },
        },
      }),
      [READ],
    );

    expect(verified.patch?.type).toBe('add-scenario');
  });

  it('rejette une modification dont le texte contient du code', () => {
    const verified = verifyReply(
      reply({ patch: { type: 'add-open-question', question: 'Faut-il appeler getOrders ?' } }),
      [READ],
    );

    expect(verified.patch).toBeNull();
  });

  it('rejette une réécriture de section qui contient un nom de fichier', () => {
    const verified = verifyReply(
      reply({ patch: { type: 'rewrite-section', sectionKey: 'context', text: 'Voir orders.ts' } }),
      [READ],
    );

    expect(verified.patch).toBeNull();
  });
});
