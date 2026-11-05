import { type Endpoint, type HttpMethod, HttpMethodSchema } from '@ticket-studio/shared';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import type { RepoFile } from './file-tree';
import { RepoAccessError } from './errors';
import { readRepoFile } from './read-file';

const OPENAPI_FILE = /(^|\/)(openapi|swagger)\.(json|ya?ml)$/i;
const SOURCE_FILE = /\.(ts|tsx|js|jsx|mjs|cjs|py)$/;
const TEST_FILE = /(\.(test|spec)\.[a-z]+$)|(^|\/)(__tests__|tests?)\//i;
const MAX_SOURCE_FILES = 500;

// Express, Fastify, Koa, Hono : routes déclarées par app.get('/x') ou router.post('/x').
const JS_FRAMEWORK_IMPORT = /(?:from\s+|require\(\s*)['"](?:express|fastify|koa|hono)['"]/;
const JS_ROUTE = /\b\w+\.(get|post|put|patch|delete)\(\s*(['"`])(\/[^'"`]*)\2/g;

// NestJS : @Controller('prefixe') puis @Get('sous-chemin').
const NEST_IMPORT = '@nestjs/common';
const NEST_CONTROLLER = /@Controller\(\s*(?:(['"`])([^'"`]*)\1)?\s*\)/;
const NEST_ROUTE = /@(Get|Post|Put|Patch|Delete)\(\s*(?:(['"`])([^'"`]*)\2)?\s*\)/g;

// FastAPI : @app.get('/x'). Flask : @app.route('/x', methods=['GET']).
const FASTAPI_IMPORT = /^\s*(?:from|import)\s+fastapi\b/m;
const FLASK_IMPORT = /^\s*(?:from|import)\s+flask\b/m;
const FASTAPI_ROUTE = /@\w+\.(get|post|put|patch|delete)\(\s*(['"])([^'"]*)\2/g;
const FLASK_ROUTE = /@\w+\.route\(\s*(['"])([^'"]*)\1([^)]*)\)/g;
const FLASK_METHODS = /methods\s*=\s*\[([^\]]*)\]/;

// Next.js (app router) : le dossier décrit la route, les fonctions exportées décrivent les méthodes.
const NEXT_ROUTE_FILE = /(?:^|\/)app\/(?:(.*)\/)?route\.(?:ts|tsx|js|jsx|mjs)$/;
const NEXT_HANDLER = /export\s+(?:async\s+)?(?:function|const)\s+(GET|POST|PUT|PATCH|DELETE)\b/g;

const OpenApiSchema = z.object({
  paths: z.record(z.string(), z.record(z.string(), z.unknown())),
});

export function isTestFile(filePath: string): boolean {
  return TEST_FILE.test(filePath);
}

// Lit la section « paths » d'un fichier OpenAPI (JSON ou YAML). Un fichier invalide donne une liste vide.
export function parseOpenApi(content: string, source: string): Endpoint[] {
  let document: unknown;
  try {
    document = parseYaml(content);
  } catch {
    return [];
  }

  const parsed = OpenApiSchema.safeParse(document);
  if (!parsed.success) {
    return [];
  }

  const endpoints: Endpoint[] = [];
  for (const [routePath, pathItem] of Object.entries(parsed.data.paths)) {
    for (const key of Object.keys(pathItem)) {
      const method = toHttpMethod(key);
      if (method !== null) {
        endpoints.push({ method, path: routePath, source });
      }
    }
  }
  return endpoints;
}

// Routes déclarées dans un fichier source, selon le framework détecté dans ce fichier.
export function extractRoutesFromSource(source: string, content: string): Endpoint[] {
  const endpoints: Endpoint[] = [];

  endpoints.push(...extractNextRoutes(source, content));
  if (JS_FRAMEWORK_IMPORT.test(content)) {
    endpoints.push(...extractJsRoutes(source, content));
  }
  if (content.includes(NEST_IMPORT)) {
    endpoints.push(...extractNestRoutes(source, content));
  }
  if (FASTAPI_IMPORT.test(content)) {
    endpoints.push(...extractFastApiRoutes(source, content));
  }
  if (FLASK_IMPORT.test(content)) {
    endpoints.push(...extractFlaskRoutes(source, content));
  }

  return sortEndpoints(endpoints);
}

// Point d'entrée : le fichier OpenAPI s'il existe, sinon l'analyse des routes des fichiers source.
export async function extractEndpoints(root: string, files: RepoFile[]): Promise<Endpoint[]> {
  const openApiFile = files.find((file) => OPENAPI_FILE.test(file.path));
  if (openApiFile) {
    const content = await readOrNull(root, openApiFile.path);
    return content === null ? [] : sortEndpoints(parseOpenApi(content, openApiFile.path));
  }

  const sourceFiles = files
    .filter((file) => SOURCE_FILE.test(file.path) && !isTestFile(file.path))
    .slice(0, MAX_SOURCE_FILES);

  const perFile = await Promise.all(
    sourceFiles.map(async (file) => {
      const content = await readOrNull(root, file.path);
      return content === null ? [] : extractRoutesFromSource(file.path, content);
    }),
  );
  return sortEndpoints(perFile.flat());
}

async function readOrNull(root: string, relativePath: string): Promise<string | null> {
  try {
    return await readRepoFile(root, relativePath);
  } catch (error) {
    if (error instanceof RepoAccessError) {
      return null;
    }
    throw error;
  }
}

function toHttpMethod(value: string): HttpMethod | null {
  const parsed = HttpMethodSchema.safeParse(value.toUpperCase());
  return parsed.success ? parsed.data : null;
}

function extractJsRoutes(source: string, content: string): Endpoint[] {
  return [...content.matchAll(JS_ROUTE)].flatMap((match) => {
    const method = toHttpMethod(match[1] ?? '');
    return method === null ? [] : [{ method, path: match[3] ?? '/', source }];
  });
}

function extractNestRoutes(source: string, content: string): Endpoint[] {
  const prefix = NEST_CONTROLLER.exec(content)?.[2] ?? '';
  return [...content.matchAll(NEST_ROUTE)].flatMap((match) => {
    const method = toHttpMethod(match[1] ?? '');
    return method === null ? [] : [{ method, path: joinRoute(prefix, match[3] ?? ''), source }];
  });
}

function extractFastApiRoutes(source: string, content: string): Endpoint[] {
  return [...content.matchAll(FASTAPI_ROUTE)].flatMap((match) => {
    const method = toHttpMethod(match[1] ?? '');
    return method === null ? [] : [{ method, path: match[3] ?? '/', source }];
  });
}

function extractFlaskRoutes(source: string, content: string): Endpoint[] {
  return [...content.matchAll(FLASK_ROUTE)].flatMap((match) => {
    const routePath = match[2] ?? '/';
    const methodList = FLASK_METHODS.exec(match[3] ?? '')?.[1] ?? "'GET'";
    const names = [...methodList.matchAll(/['"](\w+)['"]/g)].map((item) => item[1] ?? '');
    return names.flatMap((name) => {
      const method = toHttpMethod(name);
      return method === null ? [] : [{ method, path: routePath, source }];
    });
  });
}

function extractNextRoutes(source: string, content: string): Endpoint[] {
  const fileMatch = NEXT_ROUTE_FILE.exec(source);
  if (fileMatch === null) {
    return [];
  }

  const segments = (fileMatch[1] ?? '')
    .split('/')
    .filter((segment) => segment !== '' && !/^\(.*\)$/.test(segment))
    .map((segment) => segment.replace(/^\[\.\.\.(.+)\]$/, ':$1').replace(/^\[(.+)\]$/, ':$1'));
  const routePath = `/${segments.join('/')}`;

  return [...content.matchAll(NEXT_HANDLER)].flatMap((match) => {
    const method = toHttpMethod(match[1] ?? '');
    return method === null ? [] : [{ method, path: routePath, source }];
  });
}

function joinRoute(prefix: string, subPath: string): string {
  const parts = [prefix, subPath].map((part) => part.replace(/^\/+|\/+$/g, '')).filter(Boolean);
  return `/${parts.join('/')}`;
}

// Supprime les doublons et trie par chemin puis par méthode, pour un résultat stable.
function sortEndpoints(endpoints: Endpoint[]): Endpoint[] {
  const unique = new Map<string, Endpoint>();
  for (const endpoint of endpoints) {
    unique.set(`${endpoint.method} ${endpoint.path} ${endpoint.source}`, endpoint);
  }
  return [...unique.values()].sort(
    (a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method),
  );
}
