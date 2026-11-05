import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { z } from 'zod';
import { AppError } from '../lib/app-error';
import { getExclusionReason, getRipgrepExcludeGlobs, MAX_FILE_BYTES } from './blacklist';

const execFileAsync = promisify(execFile);

const MAX_RESULTS = 50;
const MAX_MATCHES_PER_FILE = 3;
const MAX_LINE_LENGTH = 200;
const RG_NO_MATCH_EXIT_CODE = 1;

export interface CodeMatch {
  path: string;
  line: number;
  text: string;
}

const RgMatchSchema = z.object({
  type: z.literal('match'),
  data: z.object({
    path: z.object({ text: z.string() }),
    lines: z.object({ text: z.string() }),
    line_number: z.number(),
  }),
});

// Recherche littérale dans le clone avec ripgrep. Les fichiers de la liste noire ne sont jamais ouverts,
// et les résultats sont filtrés une seconde fois au cas où.
export async function searchCode(root: string, query: string): Promise<CodeMatch[]> {
  const term = query.trim();
  if (term === '') {
    return [];
  }

  const args = [
    '--json',
    '--fixed-strings',
    '--ignore-case',
    '--max-count',
    String(MAX_MATCHES_PER_FILE),
    '--max-filesize',
    `${MAX_FILE_BYTES / 1024}K`,
    ...getRipgrepExcludeGlobs().flatMap((glob) => ['--glob', glob]),
    '--',
    term,
    '.',
  ];

  let stdout: string;
  try {
    ({ stdout } = await execFileAsync('rg', args, {
      cwd: root,
      maxBuffer: 20 * 1024 * 1024,
      encoding: 'utf8',
    }));
  } catch (error) {
    if (hasExitCode(error, RG_NO_MATCH_EXIT_CODE)) {
      return [];
    }
    if (hasErrorCode(error, 'ENOENT')) {
      throw new AppError(500, 'ripgrep (rg) doit être installé sur le serveur');
    }
    throw error;
  }

  return parseMatches(stdout)
    .filter((match) => getExclusionReason(match.path) === null)
    .slice(0, MAX_RESULTS);
}

function parseMatches(stdout: string): CodeMatch[] {
  const matches: CodeMatch[] = [];
  for (const line of stdout.split('\n')) {
    if (line.trim() === '') {
      continue;
    }
    const parsed = RgMatchSchema.safeParse(JSON.parse(line));
    if (!parsed.success) {
      continue;
    }
    const { path: pathInfo, lines, line_number: lineNumber } = parsed.data.data;
    matches.push({
      path: normalizeRgPath(pathInfo.text),
      line: lineNumber,
      text: lines.text.trim().slice(0, MAX_LINE_LENGTH),
    });
  }
  return matches;
}

// ripgrep préfixe les chemins par "./" : on les ramène à des chemins relatifs au dépôt, avec "/".
function normalizeRgPath(rawPath: string): string {
  return rawPath.replace(/^\.[\\/]/, '').replace(/\\/g, '/');
}

function hasExitCode(error: unknown, code: number): boolean {
  return error instanceof Error && 'code' in error && error.code === code;
}

function hasErrorCode(error: unknown, code: string): boolean {
  return error instanceof Error && 'code' in error && error.code === code;
}
