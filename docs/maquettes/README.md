# Maquettes Ticket Studio (Claude Design)

Ces fichiers sont les maquettes validées de l'application, exportées depuis Claude Design.
Ce sont des **spécifications visuelles et fonctionnelles**, pas du code à copier.
L'application se construit avec les composants **shadcn/ui** réels (React + Tailwind).

| Fichier | Écran | Route |
|---|---|---|
| `01-saisie.dc.html` | Saisie du ticket | `/saisie` |
| `02-analyse.dc.html` | Analyse du projet (progression) | `/analyse` |
| `03-diagnostic.dc.html` | Diagnostic (statut + sections) | `/diagnostic` |
| `04-atelier.dc.html` | Atelier (sidebar, conversation, suggestions, diagnostic détaillé, ticket) | `/atelier` |
| `05-contexte.dc.html` | Contexte du projet (README, commits, endpoints) | `/contexte` |

## Comment lire un fichier `.dc.html`

- **Mise en page et style** : tout est en styles inline dans le HTML (couleurs, espacements, tailles,
  bordures). Ils reprennent le thème shadcn « neutral » et la police Geist.
- **`{{nom}}`** : une valeur calculée, fournie par la méthode `renderVals()` du script en bas du fichier.
- **`<sc-if value="{{x}}">`** : un bloc affiché seulement si `x` est vrai (états conditionnels).
- **`<sc-for list="{{items}}" as="item">`** : une liste répétée pour chaque élément.
- **`onClick="{{handler}}"`** : l'action d'un bouton, définie dans `renderVals()`.
- **Le script `class Component extends DCLogic`** décrit l'état de l'écran (`this.state`), les données
  de démonstration et les règles d'affichage (statut, badges, compteurs). C'est la meilleure source
  pour comprendre le comportement attendu.
- `support.js` et `<helmet>` sont propres à l'outil de maquette : à ignorer.

## Correspondance avec les composants shadcn/ui

| Dans la maquette | Composant shadcn |
|---|---|
| Blocs blancs bordés, ombre légère | `Card` (CardHeader, CardTitle, CardDescription, CardContent) |
| Boutons noirs / bordés / transparents | `Button` (default, outline, ghost, destructive) |
| Petites étiquettes | `Badge` |
| Champs de saisie | `Input`, `Textarea`, `Label` |
| Choix du type de ticket | `ToggleGroup` |
| Encadrés colorés (bloquant, question ouverte, statut) | `Alert` |
| Barres de progression | `Progress` |
| Fil d'Ariane en en-tête | `Breadcrumb` |
| Colonne de gauche de l'Atelier | `Sidebar` (SidebarGroup, SidebarMenu, SidebarMenuBadge) |
| Liste des endpoints | `Table` |
| Icônes | `lucide-react` |

## Règles à respecter (rappel)

- Le ticket ne contient jamais de code ni de nom technique.
- Statut : *Pas prêt* / *Presque prêt* / *Prêt à développer*, avec le nombre de bloquants et de
  recommandations. Pas de score numérique.
- Les textes affichés dans les maquettes (exemple « archivage des commandes ») sont des données de
  démonstration : dans l'application, ils viennent de l'API.
