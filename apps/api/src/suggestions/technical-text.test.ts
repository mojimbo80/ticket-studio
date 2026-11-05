import { describe, expect, it } from 'vitest';
import { containsTechnicalText } from './technical-text';

describe('containsTechnicalText', () => {
  it.each([
    'Veux-tu le même rendu et le même comportement pour les commandes ?',
    'Quelles commandes sont « terminées » ?',
    'Une commande passe par 5 étapes : en attente, payée, expédiée, livrée, annulée.',
    'Le support consulte les commandes d’un client dans le back-office.',
    'Les remboursements ont été ajoutés récemment.',
  ])('laisse passer un texte de produit : %s', (text) => {
    expect(containsTechnicalText(text)).toBe(false);
  });

  it.each([
    ['un identifiant en camelCase', 'Appeler getOrders avant l’affichage'],
    ['un nom de fichier', 'Voir le détail dans orders.ts'],
    ['un chemin de fichier', 'Voir src/orders/service de la commande'],
    ['un endpoint', 'Le endpoint de suivi doit rester visible'],
    ['un identifiant en snake_case', 'Ajouter le champ order_status'],
    ['du code entre accents graves', 'Filtrer avec `archived`'],
    ['une route HTTP', 'Ouvrir la route /orders/:id'],
    ['un verbe HTTP', 'Un appel DELETE supprime la commande'],
    ['un nom de table', 'Lire la table des commandes'],
    ['une colonne', 'Ajouter la colonne archivée'],
  ])('détecte %s', (_label, text) => {
    expect(containsTechnicalText(text)).toBe(true);
  });
});
