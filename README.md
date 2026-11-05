# Ticket Studio

Application web qui aide un chef de produit (PM) à rédiger un ticket complet, puis à le copier en Markdown
dans Jira, Trello ou Monday. Un agent LLM lit le dépôt du projet pour proposer les sections manquantes,
des suggestions et une conversation sourcées. La référence produit et technique est dans [CLAUDE.md](CLAUDE.md),
et les maquettes validées sont dans [docs/maquettes/](docs/maquettes/README.md).

## Prérequis

| Outil                     | Rôle                                                               | Installation (Windows, exemple)                 |
| ------------------------- | ------------------------------------------------------------------ | ----------------------------------------------- |
| Node.js 24 ou plus récent | Runtime de l'API et du front                                       | `winget install OpenJS.NodeJS.LTS`              |
| pnpm                      | Gestionnaire de paquets (monorepo)                                 | `npm install -g pnpm`                           |
| git                       | Clone et mise à jour du dépôt analysé, **installé sur le serveur** | `winget install Git.Git`                        |
| ripgrep (`rg`)            | Recherche dans le code, **installé sur le serveur**                | `winget install BurntSushi.ripgrep.MSVC`        |
| PostgreSQL 17             | Base de données                                                    | Docker (voir ci-dessous) ou installation locale |

Vérifiez dans un **nouveau terminal** que `git --version` et `rg --version` répondent.
Sous Git Bash, `rg` peut apparaître comme une simple fonction du shell : préférez PowerShell ou `cmd` pour lancer l'API.

### PostgreSQL : avec Docker ou en local

- **Docker** : `docker compose up -d --wait db` lance un PostgreSQL 17 sur `localhost:5432`
  (utilisateur, mot de passe et base `ticket_studio`, voir `docker-compose.yml`). `pnpm dev` le démarre aussi.
- **Installation locale** : créez une base `ticket_studio` et un utilisateur, puis renseignez `DATABASE_URL`.
  Dans ce cas, `pnpm dev` ne touche pas à Docker : lancez seulement l'API et le front.

## Installation

```bash
pnpm install
cp .env.example .env          # puis renseignez les valeurs (voir ci-dessous)
pnpm db:migrate               # applique les migrations Prisma (base accessible)
pnpm dev                      # API (port 3000) et front (port 5173)
```

Ouvrez <http://localhost:5173> : la racine redirige vers la saisie.

**Scripts de build** : pnpm 12 bloque les scripts d'installation des dépendances. Si `pnpm install` le signale,
approuvez les trois paquets nécessaires : `pnpm approve-builds prisma @prisma/engines esbuild`.

## Variables d'environnement

Le fichier `.env` est à la racine du monorepo : l'API et Prisma le lisent. Il n'est jamais versionné.
L'API valide ces variables au démarrage et signale celles qui manquent ou sont mal formées.

| Variable            | Obligatoire | Rôle                                                                                                      |
| ------------------- | ----------- | --------------------------------------------------------------------------------------------------------- |
| `REPO_URL`          | oui         | Adresse du dépôt à analyser                                                                               |
| `REPO_BRANCH`       | oui         | Branche suivie (lettres, chiffres, `.`, `_`, `/`, `-`)                                                    |
| `REPO_DIR`          | oui         | Dossier du clone, **relatif à la racine du monorepo** (par défaut `./data/repo`)                          |
| `GITHUB_TOKEN`      | non         | Token GitHub en lecture seule, pour un dépôt privé uniquement                                             |
| `ANTHROPIC_API_KEY` | oui         | Clé de l'API Anthropic                                                                                    |
| `LLM_MODEL`         | oui         | Modèle utilisé par l'agent (par défaut `claude-sonnet-5-5`)                                               |
| `DATABASE_URL`      | oui         | Connexion PostgreSQL, par exemple `postgresql://user:password@localhost:5432/ticket_studio?schema=public` |
| `WEB_ORIGIN`        | non         | Origine du front autorisée par CORS (par défaut `http://localhost:5173`)                                  |

Ne mettez jamais de vraies clés dans `.env.example`. Un token GitHub doit être un token **fine-grained** limité au dépôt,
avec la permission _Contents : Read-only_.

## Le dépôt analysé

- Au démarrage, le dépôt est cloné dans `REPO_DIR` (50 derniers commits), ou mis à jour s'il existe déjà.
- Le token passe à chaque appel git dans un en-tête d'authentification : il n'est jamais écrit dans l'URL,
  dans `.git/config` ni dans les journaux.
- Avant chaque analyse, le clone est mis à jour si la dernière synchronisation date de plus de 5 minutes.
  « Ré-analyser » force la synchronisation.
- Ne sont jamais lus ni recherchés par l'agent : `.git`, `node_modules`, `dist`, `build`, les fichiers de verrouillage,
  `.env*`, les clés et certificats, les binaires, et les fichiers de plus de 200 Ko. Un lien symbolique qui sort du clone est refusé.

## Lancement et commandes

| Commande                                          | Effet                                                  |
| ------------------------------------------------- | ------------------------------------------------------ |
| `pnpm dev`                                        | Lance PostgreSQL (Docker), l'API et le front           |
| `pnpm db:up` / `pnpm db:down`                     | Démarre / arrête PostgreSQL via Docker                 |
| `pnpm db:migrate`                                 | Applique les migrations Prisma                         |
| `pnpm test`                                       | Tests unitaires de l'API et du paquet partagé          |
| `pnpm --filter @ticket-studio/web e2e`            | Tests e2e Playwright du parcours complet (API simulée) |
| `pnpm --filter @ticket-studio/api ask "question"` | Pose une question à l'agent sur le dépôt (test manuel) |
| `pnpm typecheck`                                  | Vérifie les types de tous les paquets                  |
| `pnpm lint`                                       | ESLint sur tout le monorepo                            |
| `pnpm format:check`                               | Vérifie le formatage Prettier                          |
| `pnpm build`                                      | Build de production du front                           |

Les tests e2e installent Chromium une fois : `pnpm exec playwright install chromium`.

## Architecture

```
apps/
  api/   Express 5 : routes HTTP, module repo (git, sûreté des chemins), LLM (agent, outils), diagnostic, chat
  web/   React + Vite : TanStack Router (fichiers), TanStack Query, shadcn/ui, Zustand
packages/
  shared/ schémas Zod et règles pures, partagés par l'API et le front
```

### Choix techniques

- **Schémas partagés** (`packages/shared`) : chaque requête et chaque réponse HTTP est validée par Zod, côté API et côté front.
  Les règles déterministes (sections vides, cas négatifs, statut `computeStatus`) vivent aussi dans ce paquet, pour que le serveur
  et le front calculent exactement la même chose.
- **Le LLM ne décide pas du statut.** Il rédige des propositions et relève des termes ambigus. Le code vérifie chaque source :
  une source citée doit avoir été lue par un outil pendant la génération, sinon elle est écartée. Un texte qui contient du code
  ou un nom technique est aussi écarté avant d'atteindre le PM.
- **Garde-fous de l'agent** : nombre d'appels d'outils plafonné, résultats de recherche limités, fichiers tronqués,
  journal des fichiers lus, délai et relances sur les appels à l'API Anthropic. Les outils passent tous par le module `repo`,
  donc par la liste noire.
- **Prompt caching** : la carte du projet est un bloc système mis en cache entre les appels.
- **Flux SSE** pour l'analyse et la conversation : la progression s'affiche étape par étape. Le client lit le flux avec `fetch`
  et `ReadableStream`, et annule la requête quand on quitte la page.
- **État côté client** : le ticket, les réponses de l'atelier et l'historique du chat sont en mémoire (Zustand), pendant la session.
  Rien n'est persisté côté serveur, sauf l'index du projet (`ProjectIndex`).
- **Cache TanStack Query** : clés centralisées (`queries/keys.ts`). Le diagnostic de l'analyse est écrit dans le cache
  `analysis`, pour que Diagnostic et Atelier le lisent sans relancer l'analyse. Une route sans cache renvoie vers `/analyse`.
- **Devtools** : chargés uniquement en développement. Le build de production n'en contient pas.

### Sécurité

- Aucun secret n'est envoyé au front : seules les variables `import.meta.env` préfixées par `VITE_` sont exposées au bundle,
  et il n'en existe aucune. Vérifiez avec `pnpm --filter @ticket-studio/web build` puis une recherche de `sk-ant` dans `dist/`.
- L'agent ne peut lire aucun fichier de la liste noire : les tests `read-file`, `search-code` et `repo-tools` le vérifient.
- Les journaux ne contiennent ni token, ni contenu de fichier, ni paramètres d'outil : seulement des noms, des statuts et des durées.

## Tests

- **API** : `pnpm --filter @ticket-studio/api test` couvre la sûreté des chemins, la liste noire, l'extraction des endpoints,
  la boucle d'outils, la vérification des sources et du chat, et le diagnostic.
- **Paquet partagé** : snapshots de `ticketToMarkdown`.
- **e2e** : `apps/web/e2e/parcours.spec.ts` parcourt la saisie, l'analyse, le diagnostic, l'atelier (suggestions, conversation,
  copie en Markdown), la garde de navigation et la page introuvable. L'API est simulée par interception réseau.

## Dépannage

- **« ripgrep (rg) doit être installé »** : `rg` n'est pas dans le PATH du processus qui lance l'API. Relancez le terminal, ou
  ajoutez le dossier de ripgrep au PATH système.
- **« Synchronisation du dépôt impossible »** : vérifiez `REPO_URL`, `REPO_BRANCH`, puis le token (`GITHUB_TOKEN`) si le dépôt est privé.
  Un 403 signifie que le token n'a pas accès au dépôt.
- **« Configuration invalide »** au démarrage de l'API : la liste indique la variable en cause dans `.env`.
- **Migrations** : si `pnpm db:migrate` ne trouve pas la base, vérifiez `DATABASE_URL` et que PostgreSQL écoute sur le port indiqué.
