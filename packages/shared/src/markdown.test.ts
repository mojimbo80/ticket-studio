import { describe, expect, it } from 'vitest';
import type { Ticket } from './ticket';
import { ticketToMarkdown } from './markdown';

const complete: Ticket = {
  type: 'story',
  title: 'Permettre aux clients d’archiver leurs commandes terminées',
  context: 'Les clients réguliers accumulent de nombreuses commandes.',
  description: 'En tant que client, je veux archiver mes commandes livrées ou annulées.',
  scenarios: [
    {
      given: 'une commande livrée',
      when: 'le client clique sur « Archiver »',
      then: 'elle passe dans l’onglet « Archivées »',
    },
    {
      given: 'une commande en cours de livraison',
      when: 'le client affiche ses commandes',
      then: 'l’action « Archiver » n’est pas proposée',
    },
  ],
  links: ['https://maquette.example/archives'],
};

const titleOnly: Ticket = {
  type: 'bug',
  title: 'Le total du panier ignore les remises',
  context: '',
  description: '',
  scenarios: [],
  links: [],
};

describe('ticketToMarkdown', () => {
  it('produit un ticket complet, avec précisions et questions ouvertes', () => {
    const markdown = ticketToMarkdown(complete, {
      precisions: [{ label: 'Rendu', text: 'reprendre l’écran « Mes paniers sauvegardés »' }],
      openQuestions: ['Une commande archivée puis remboursée doit-elle réapparaître ?'],
    });

    expect(markdown).toMatchSnapshot();
  });

  it('omet les sections vides d’un ticket minimal', () => {
    expect(ticketToMarkdown(titleOnly)).toMatchSnapshot();
  });

  it('reste du texte simple, sans HTML ni tableau', () => {
    const markdown = ticketToMarkdown(complete, {
      precisions: [{ label: 'Périmètre', text: 'web uniquement' }],
      openQuestions: ['Question ouverte'],
    });

    expect(markdown).not.toMatch(/<\/?[a-z][^>]*>/i);
    expect(markdown).not.toContain('|');
  });

  it('se termine par un saut de ligne', () => {
    expect(ticketToMarkdown(titleOnly).endsWith('\n')).toBe(true);
  });
});
