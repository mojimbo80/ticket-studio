# CLAUDE.md — Ticket Studio

Référence pour tout le projet. À lire avant toute modification.

## Produit

**Ticket Studio** est une application web qui aide un PM (chef de produit) à rédiger un ticket parfait, puis à le copier en Markdown dans Jira, Trello ou Monday.

Un agent LLM analyse le dépôt du projet concerné (dépôt codé en dur, cloné localement sur le serveur et mis à jour avec `git`) pour proposer les sections manquantes et des suggestions.

### Parcours utilisateur

**Saisie → Analyse → Diagnostic → Atelier**, plus une page **Contexte du projet**.

### Périmètre

Hors périmètre du MVP : comptes utilisateurs, brouillons, multi-projet, intégrations Jira/Linear.

## Maquettes

- Les maquettes se trouvent dans `docs/maquettes/`. Lire `docs/maquettes/README.md` en premier.
- Elles sont la **référence visuelle et fonctionnelle** de chaque écran. Ce sont des spécifications, pas du code à copier.
- L'interface se construit avec les **vrais composants shadcn/ui** (React + Tailwind), pas avec des imitations.

| Fichier                 | Écran                                                                     | Route         |
| ----------------------- | ------------------------------------------------------------------------- | ------------- |
| `01-saisie.dc.html`     | Saisie du ticket                                                          | `/saisie`     |
| `02-analyse.dc.html`    | Analyse du projet (progression)                                           | `/analyse`    |
| `03-diagnostic.dc.html` | Diagnostic (statut + sections)                                            | `/diagnostic` |
| `04-atelier.dc.html`    | Atelier (sidebar, conversation, suggestions, diagnostic détaillé, ticket) | `/atelier`    |
| `05-contexte.dc.html`   | Contexte du projet (README, commits, endpoints)                           | `/contexte`   |

- Les fichiers `.dc.html` contiennent les styles en ligne et un script `class Component extends DCLogic` qui décrit l'état de l'écran et les règles d'affichage. C'est la meilleure source pour le comportement attendu.
- `support.js` et `<helmet>` sont propres à l'outil de maquette : à ignorer.
- Les textes des maquettes (par exemple « archivage des commandes ») sont des données de démonstration : dans l'application, ils viennent de l'API.

## Règles produit

1. **Le ticket ne contient jamais de code ni de nom technique** (fichier, table, endpoint, etc.). Tout est formulé en langage produit, par exemple : « reprendre l'écran Mes paniers sauvegardés ».
2. **Sections du ticket** :
   - Titre (seul champ obligatoire)
   - Contexte
   - Description (user story)
   - Critères d'acceptation (Given / When / Then)
   - Liens
3. **Pas de score numérique.** Le statut du ticket est l'un des trois suivants :
   - **Pas prêt** : une section obligatoire est vide.
   - **Presque prêt** : les sections sont remplies, mais au moins un bloquant subsiste.
   - **Prêt à développer** : 0 bloquant.
   - On affiche aussi le nombre de **bloquants** et de **recommandations**.
4. **Toute suggestion cite une source réelle du dépôt**, et cette source est **vérifiée côté serveur**. Une suggestion sans source vérifiée ne doit pas être affichée.

## Stack

- Monorepo **pnpm**
- **TypeScript strict**
- Front : **React + Vite**, **TanStack Router** (routing par fichiers, routes typées), **TanStack Query** (appels API et cache), **shadcn/ui + Tailwind**
- Validation : **Zod**
- Back : **API Node avec Express**
- Base de données : **Prisma avec PostgreSQL**
- Agent : **SDK Anthropic**

## Conventions

### Schémas partagés

- Les schémas Zod sont définis dans `packages/shared`.
- Ils servent à **valider chaque requête et chaque réponse Express**, et à **parser chaque réponse côté front**.

### Front

- **Tout appel API passe par TanStack Query.** Les `queryOptions` sont regroupées par domaine, et les clés de cache sont centralisées.
- **Aucun `fetch` direct dans un composant.**
- **Navigation uniquement via TanStack Router** : `Link`, `useNavigate`, et search params validés avec Zod.

### Général

- **Aucun secret côté front.**
- **Pas de `any`.**
- **Une fonction = une responsabilité.**
- **Textes de l'interface en français.**

## Git

- Ne jamais créer de commit sans l'accord explicite de l'utilisateur. Demander d'abord : « Voulez-vous que je fasse le commit ? »
- Ne jamais contourner les hooks git.
