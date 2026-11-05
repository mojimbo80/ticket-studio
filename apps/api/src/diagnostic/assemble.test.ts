import { computeStatus, evaluateRules, type Ticket } from '@ticket-studio/shared';
import { describe, expect, it } from 'vitest';
import { assembleDiagnosis } from './assemble';
import type { LlmDiagnosis } from './llm-schema';

const UNVERIFIED = 'Aucune source du projet ne confirme cette proposition.';

const titleOnly: Ticket = {
  type: 'story',
  title: 'Archiver les commandes',
  context: '',
  description: '',
  scenarios: [],
  links: [],
};

const complete: Ticket = {
  type: 'story',
  title: 'Archiver les commandes terminées',
  context: 'Les clients accumulent des commandes.',
  description: 'En tant que client, je veux archiver mes commandes.',
  scenarios: [
    {
      given: 'une commande livrée',
      when: 'le client clique sur Archiver',
      then: 'elle passe dans Archivées',
    },
    {
      given: 'une commande en cours',
      when: 'le client clique sur Archiver',
      then: 'l’action est impossible, un message d’erreur explique pourquoi',
    },
  ],
  links: ['https://maquette.example/archives'],
};

const noLlmFindings: LlmDiagnosis = { proposals: [], ambiguousTerms: [] };

describe('evaluateRules', () => {
  it('rend bloquantes les sections vides et recommande les cas manquants', () => {
    const issues = evaluateRules(titleOnly);

    expect(
      issues.filter((issue) => issue.severity === 'bloquant').map((issue) => issue.id),
    ).toEqual(['section-vide-context', 'section-vide-description', 'section-vide-criteria']);
    expect(issues.filter((issue) => issue.severity === 'recommandation')).toHaveLength(3);
  });

  it('ne relève plus rien de bloquant sur un ticket complet', () => {
    const issues = evaluateRules(complete);

    expect(issues.some((issue) => issue.severity === 'bloquant')).toBe(false);
    expect(issues.map((issue) => issue.id)).not.toContain('absence-cas-negatif');
    expect(issues.map((issue) => issue.id)).not.toContain('absence-cas-erreur');
  });
});

describe('computeStatus', () => {
  it('est pas prêt quand le titre est vide', () => {
    const ticket = { ...titleOnly, title: '  ' };

    expect(computeStatus(ticket, evaluateRules(ticket)).status).toBe('pas-pret');
  });

  it('est presque prêt quand un bloquant reste, et prêt sans bloquant', () => {
    expect(computeStatus(titleOnly, evaluateRules(titleOnly)).status).toBe('presque-pret');
    expect(computeStatus(complete, evaluateRules(complete))).toEqual({
      status: 'pret',
      blockers: 0,
      recommendations: 0,
    });
  });
});

describe('assembleDiagnosis', () => {
  it('ne garde que les sources réellement lues et signale une proposition sans source', () => {
    const llm: LlmDiagnosis = {
      proposals: [
        {
          sectionKey: 'context',
          text: 'Les clients accumulent des commandes.',
          scenario: null,
          assumption: null,
          sources: ['src/orders.ts', 'src/inventé.ts'],
        },
        {
          sectionKey: 'description',
          text: 'En tant que client…',
          scenario: null,
          assumption: null,
          sources: ['src/absent.ts'],
        },
      ],
      ambiguousTerms: [],
    };

    const diagnosis = assembleDiagnosis(titleOnly, llm, ['src/orders.ts']);
    const context = diagnosis.proposals.find((proposal) => proposal.sectionKey === 'context');
    const description = diagnosis.proposals.find(
      (proposal) => proposal.sectionKey === 'description',
    );

    expect(context?.sources).toEqual(['src/orders.ts']);
    expect(context?.assumption).toBeNull();
    expect(description?.sources).toEqual([]);
    expect(description?.assumption).toBe(UNVERIFIED);
  });

  it('ignore les propositions pour une section déjà remplie et les critères sans scénario', () => {
    const llm: LlmDiagnosis = {
      proposals: [
        {
          sectionKey: 'context',
          text: 'Nouveau contexte',
          scenario: null,
          assumption: null,
          sources: [],
        },
        {
          sectionKey: 'criteria',
          text: 'Critère sans scénario',
          scenario: null,
          assumption: null,
          sources: [],
        },
      ],
      ambiguousTerms: [],
    };

    const diagnosis = assembleDiagnosis(complete, llm, []);

    expect(diagnosis.proposals).toEqual([]);
  });

  it("retient un terme ambigu seulement s'il apparaît dans le ticket, et le rend bloquant", () => {
    const llm: LlmDiagnosis = {
      proposals: [],
      ambiguousTerms: [
        { term: 'terminées', reason: 'on ne sait pas si une commande annulée est incluse' },
        { term: 'expédiées', reason: 'mot absent du ticket' },
      ],
    };

    const diagnosis = assembleDiagnosis(complete, llm, []);
    const ambiguities = diagnosis.issues.filter((issue) => issue.kind === 'ambiguite');

    expect(ambiguities.map((issue) => issue.term)).toEqual(['terminées']);
    expect(diagnosis.status).toBe('presque-pret');
    expect(diagnosis.blockers).toBe(1);
  });

  it('calcule le statut sans le LLM : sans bloquant, le ticket est prêt', () => {
    const diagnosis = assembleDiagnosis(complete, noLlmFindings, []);

    expect(diagnosis.status).toBe('pret');
    expect(diagnosis.sections.every((section) => section.filled)).toBe(true);
  });
});
