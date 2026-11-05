# Ticket Studio

Application web qui aide un chef de produit à rédiger un ticket complet, puis à le copier en Markdown
dans Jira, Trello ou Monday. Un agent LLM analyse le dépôt du projet pour proposer les sections
manquantes et des suggestions sourcées. La référence produit et technique est dans [CLAUDE.md](CLAUDE.md).

## Prérequis

- **Node.js** 24 ou plus récent, et **pnpm**
- **Docker** (pour PostgreSQL en local)
- **git** installé sur le serveur : il sert à cloner et mettre à jour le dépôt analysé
- **ripgrep** (`rg`) installé sur le serveur : il sert à la recherche dans le code

Sous Windows, par exemple : `winget install Git.Git` et `winget install BurntSushi.ripgrep.MSVC`.
Vérifiez ensuite que `git --version` et `rg --version` répondent dans un nouveau terminal.

## Installation

```bash
pnpm install
cp .env.example .env   # puis renseignez les valeurs
pnpm dev               # lance PostgreSQL, l'API et le front
pnpm db:migrate        # applique les migrations (base démarrée)
```

## Configuration

Les variables sont décrites dans `.env.example` et validées au démarrage de l'API.

| Variable            | Rôle                                                   |
| ------------------- | ------------------------------------------------------ |
| `REPO_URL`          | Adresse du dépôt à analyser                            |
| `REPO_BRANCH`       | Branche suivie (par défaut `main`)                     |
| `REPO_DIR`          | Dossier du clone, **relatif à la racine du monorepo**  |
| `GITHUB_TOKEN`      | Token en lecture seule, uniquement pour un dépôt privé |
| `ANTHROPIC_API_KEY` | Clé de l'API Anthropic                                 |
| `LLM_MODEL`         | Modèle utilisé pour les résumés                        |
| `DATABASE_URL`      | Connexion PostgreSQL                                   |

## Dépôt analysé

- Au démarrage, le dépôt est cloné dans `REPO_DIR` (historique limité aux 50 derniers commits),
  ou mis à jour s'il existe déjà.
- Le token `GITHUB_TOKEN` est passé à chaque appel git dans un en-tête d'authentification :
  il n'est jamais écrit dans l'URL, ni dans `.git/config`, ni dans les journaux.
- Toute l'analyse se fait sur ce clone. Aucun appel n'est fait à l'API GitHub.
- Avant chaque analyse, le clone est mis à jour si la dernière synchronisation date de plus de 5 minutes.
  « Ré-analyser » force la synchronisation.
- Les fichiers suivants ne sont jamais lus ni recherchés : dossiers `.git`, `node_modules`, `dist`, `build`,
  fichiers de verrouillage, `.env*`, clés et certificats, binaires, et fichiers de plus de 200 Ko.

## Commandes

| Commande                      | Effet                                 |
| ----------------------------- | ------------------------------------- |
| `pnpm dev`                    | Lance PostgreSQL, l'API et le front   |
| `pnpm db:up` / `pnpm db:down` | Démarre / arrête PostgreSQL           |
| `pnpm db:migrate`             | Applique les migrations Prisma        |
| `pnpm test`                   | Lance les tests de l'API              |
| `pnpm typecheck`              | Vérifie les types de tous les paquets |
| `pnpm lint`                   | ESLint sur tout le monorepo           |
| `pnpm format:check`           | Vérifie le formatage Prettier         |
