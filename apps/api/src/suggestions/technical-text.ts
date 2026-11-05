// Motifs qui signalent du code ou un nom technique dans un texte destiné au PM.
const TECHNICAL_PATTERNS: RegExp[] = [
  // Symboles de code : accents graves, accolades, crochets, chevrons, flèches, opérateurs.
  /[`{}[\]<>]|=>|&&|\|\|/,
  // Noms de fichiers : extensions de code, de configuration ou de documentation.
  /\.(ts|tsx|js|jsx|mjs|cjs|py|rb|go|rs|java|kt|json|ya?ml|sql|prisma|css|html|vue|svelte|md)\b/i,
  // Chemins et routes : un slash précédé d'un espace, ou un chemin à plusieurs segments.
  /(^|\s)\/[a-z][\w:{}.-]*/i,
  /\b[\w-]+\/[\w-]+\/[\w.-]+/,
  // Identifiants en camelCase ou snake_case : absents du français courant.
  /\b[a-z]+[A-Z][a-zA-Z]*\b/,
  /\b[a-z]+_[a-z_]+\b/,
  // Verbes HTTP en majuscules.
  /\b(GET|POST|PUT|PATCH|DELETE)\b/,
  // Mots techniques explicites.
  /\b(endpoints?|API|table|colonnes?|migrations?|composants?|hooks?|requêtes?|schémas?|JSON|SQL|Prisma|Zod|React)\b/i,
];

// Vrai si le texte contient du code ou un nom technique : une telle suggestion est écartée.
export function containsTechnicalText(text: string): boolean {
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(text));
}
