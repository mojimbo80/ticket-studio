import { z } from 'zod';
import { getRecentCommits } from '../../repo/commits';
import { RepoAccessError } from '../../repo/errors';
import { extractEndpoints } from '../../repo/endpoints';
import type { RepoFile } from '../../repo/file-tree';
import { readRepoFile } from '../../repo/read-file';
import { searchCode } from '../../repo/search-code';
import { LLM_LIMITS } from '../limits';
import { buildProjectMap } from '../project-map';
import { defineTool, type RuntimeTool, type ToolContext } from './define-tool';

const MAX_LINE_CHARS = 300;
const MAX_SCREEN_LINES = 2;
const SCREEN_LINE_CHARS = 160;
const SCREEN_CONTENT_HITS_CAP = 50;
const UI_EXTENSIONS = /\.(tsx|jsx|vue|svelte)$/i;
const SCREEN_DIRECTORIES =
  /(^|\/)(pages|screens|views|components|routes|features|ecrans|écrans)\//i;
const SCRIPT_EXTENSIONS = /\.(ts|js)$/i;
// Le back-end, les migrations et les tests ne sont pas des écrans : on les écarte de la recherche.
const NON_FRONT_PATHS = /(^|\/)(api|server|backend|prisma|migrations|tests?|__tests__)\//i;
const STOPWORDS = new Set([
  'avec',
  'dans',
  'pour',
  'sans',
  'leurs',
  'leur',
  'cette',
  'entre',
  'comme',
  'afin',
  'permettre',
  'pouvoir',
  'doit',
  'faire',
  'avoir',
  'être',
  'etre',
  'quand',
  'aussi',
  'plus',
  'tout',
  'tous',
  'toute',
  'bien',
  'sont',
  'mais',
  'donc',
  'vers',
  'chez',
]);

const getProjectMapTool = defineTool({
  name: 'get_project_map',
  description:
    'Donne la carte du dépôt : nombre de fichiers, dossiers principaux et premiers fichiers suivis.',
  schema: z.object({}),
  run: async (_input, context) => buildProjectMap(await context.files()),
});

const searchCodeTool = defineTool({
  name: 'search_code',
  description:
    'Recherche un texte dans le code (insensible à la casse) et renvoie les correspondances avec quelques lignes de contexte. Les fichiers exclus (dépendances, secrets, binaires) ne sont jamais renvoyés.',
  schema: z.object({
    query: z.string().min(2, 'au moins 2 caractères').max(200, 'au plus 200 caractères'),
  }),
  run: async ({ query }, context) => {
    const matches = await searchCode(context.root, query);
    if (matches.length === 0) {
      return 'Aucune correspondance.';
    }

    const shown = matches.slice(0, LLM_LIMITS.maxSearchResults);
    const snippets = await Promise.all(
      shown.map(async (match) => {
        const snippet = await readSnippet(context, match.path, match.line);
        return `${match.path}\n${snippet ?? `${match.line}: ${match.text}`}`;
      }),
    );

    const header =
      matches.length > shown.length
        ? `${matches.length} correspondances ; seules les ${shown.length} premières sont affichées.`
        : `${matches.length} correspondance(s).`;
    return [header, ...snippets].join('\n---\n');
  },
});

const readFileTool = defineTool({
  name: 'read_file',
  description:
    'Lit un fichier du dépôt par son chemin relatif, par exemple « src/app.ts ». Les fichiers très longs sont tronqués.',
  schema: z.object({
    path: z.string().min(1, 'chemin requis').max(500),
  }),
  run: async ({ path }, context) => {
    const content = await readRepoFile(context.root, path);
    context.readLog.record(path);
    return truncate(content, LLM_LIMITS.maxFileChars);
  },
});

const listEndpointsTool = defineTool({
  name: 'list_endpoints',
  description:
    'Liste les endpoints du projet (méthode, chemin et fichier source), à partir du fichier OpenAPI ou des routes du code.',
  schema: z.object({}),
  run: async (_input, context) => {
    const endpoints = await extractEndpoints(context.root, await context.files());
    if (endpoints.length === 0) {
      return 'Aucun endpoint détecté.';
    }
    return endpoints
      .slice(0, LLM_LIMITS.maxEndpoints)
      .map((endpoint) => `${endpoint.method} ${endpoint.path} (source : ${endpoint.source})`)
      .join('\n');
  },
});

const getRecentCommitsTool = defineTool({
  name: 'get_recent_commits',
  description: 'Liste les commits récents de la branche suivie, du plus récent au plus ancien.',
  schema: z.object({
    limit: z.number().int().min(1).max(20).optional(),
  }),
  run: async ({ limit }, context) => {
    const commits = await getRecentCommits(context.root, limit ?? 20);
    return commits
      .map((commit) => `${commit.shortSha} ${commit.date} ${commit.author} : ${commit.subject}`)
      .join('\n');
  },
});

const findSimilarScreensTool = defineTool({
  name: 'find_similar_screens',
  description:
    'Cherche dans le front les pages et composants qui ressemblent à un besoin décrit en français. Renvoie les fichiers les plus proches, avec leur score et quelques lignes pertinentes.',
  schema: z.object({
    need: z.string().min(3, 'décrivez le besoin').max(500),
  }),
  run: async ({ need }, context) => {
    const keywords = extractKeywords(need);
    if (keywords.length === 0) {
      return 'Besoin trop court ou composé de mots génériques : précisez-le.';
    }

    const candidates = (await context.files())
      .filter(isScreenCandidate)
      .slice(0, LLM_LIMITS.maxScreenCandidates);
    const scored = await scoreScreens(context, candidates, keywords);
    if (scored.length === 0) {
      return 'Aucun écran ou composant ne ressemble à ce besoin.';
    }

    return scored
      .slice(0, LLM_LIMITS.maxScreenResults)
      .map((screen) => `${screen.path} (score ${screen.score})\n   ${screen.lines.join('\n   ')}`)
      .join('\n');
  },
});

// Tous les outils mis à la disposition de l'agent.
export const repoTools: RuntimeTool[] = [
  getProjectMapTool,
  searchCodeTool,
  readFileTool,
  listEndpointsTool,
  getRecentCommitsTool,
  findSimilarScreensTool,
];

// Lignes autour d'une correspondance. Renvoie null si le fichier ne peut pas être lu.
async function readSnippet(
  context: ToolContext,
  filePath: string,
  line: number,
): Promise<string | null> {
  const content = await readFileOrNull(context, filePath);
  if (content === null) {
    return null;
  }

  const lines = content.split('\n');
  const first = Math.max(0, line - 1 - LLM_LIMITS.searchContextLines);
  const last = Math.min(lines.length, line + LLM_LIMITS.searchContextLines);
  return lines
    .slice(first, last)
    .map((text, offset) => {
      const number = first + offset + 1;
      const marker = number === line ? ':' : ' ';
      return `${number}${marker} ${text.slice(0, MAX_LINE_CHARS)}`;
    })
    .join('\n');
}

async function readFileOrNull(context: ToolContext, filePath: string): Promise<string | null> {
  try {
    const content = await readRepoFile(context.root, filePath);
    context.readLog.record(filePath);
    return content;
  } catch (error) {
    if (error instanceof RepoAccessError) {
      return null;
    }
    throw error;
  }
}

interface ScoredScreen {
  path: string;
  score: number;
  lines: string[];
}

async function scoreScreens(
  context: ToolContext,
  candidates: RepoFile[],
  keywords: string[],
): Promise<ScoredScreen[]> {
  const scored: ScoredScreen[] = [];
  for (const file of candidates) {
    const content = await readFileOrNull(context, file.path);
    if (content === null) {
      continue;
    }

    const lowerPath = file.path.toLowerCase();
    const lowerContent = content.toLowerCase();
    const pathHits = keywords.filter((keyword) => lowerPath.includes(keyword)).length;
    const contentHits = keywords.reduce(
      (total, keyword) =>
        total + Math.min(SCREEN_CONTENT_HITS_CAP, countOccurrences(lowerContent, keyword)),
      0,
    );
    const score = pathHits * 5 + contentHits;
    if (score > 0) {
      scored.push({ path: file.path, score, lines: matchingLines(content, keywords) });
    }
  }
  return scored.sort((a, b) => b.score - a.score);
}

function matchingLines(content: string, keywords: string[]): string[] {
  return content
    .split('\n')
    .filter((line) => keywords.some((keyword) => line.toLowerCase().includes(keyword)))
    .slice(0, MAX_SCREEN_LINES)
    .map((line) => line.trim().slice(0, SCREEN_LINE_CHARS));
}

// Mots-clés d'un besoin en français : minuscules, sans accents ni mots courants.
export function extractKeywords(need: string): string[] {
  const words = need
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4 && !STOPWORDS.has(word));
  return [...new Set(words)].slice(0, 8);
}

function isScreenCandidate(file: RepoFile): boolean {
  if (NON_FRONT_PATHS.test(file.path)) {
    return false;
  }
  if (UI_EXTENSIONS.test(file.path)) {
    return true;
  }
  return SCREEN_DIRECTORIES.test(file.path) && SCRIPT_EXTENSIONS.test(file.path);
}

function countOccurrences(text: string, term: string): number {
  return text.split(term).length - 1;
}

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  const omitted = text.length - maxChars;
  return `${text.slice(0, maxChars)}\n[… fichier tronqué : ${omitted} caractères omis]`;
}
