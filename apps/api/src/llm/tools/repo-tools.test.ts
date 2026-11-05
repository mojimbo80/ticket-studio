import { afterAll, describe, expect, it } from 'vitest';
import { MAX_FILE_BYTES } from '../../repo/blacklist';
import type { RepoFile } from '../../repo/file-tree';
import { createTempRepo, removeTempRepo } from '../../repo/test-helpers';
import { ReadLog } from '../read-log';
import type { ToolContext } from './define-tool';
import { extractKeywords, repoTools } from './repo-tools';

const files: Record<string, string> = {
  'src/app.ts': 'export const app = 1;',
  '.env': 'SECRET=needle',
  'node_modules/pkg/index.js': 'needle',
  'apps/web/src/features/paniers/paniers-sauvegardes.tsx':
    'export function PaniersSauvegardes() { return "Mes paniers sauvegardés"; }',
  'apps/web/src/features/commandes/liste-commandes.tsx':
    'export function ListeCommandes() { return "Commandes"; }',
  'apps/api/src/routes/paniers.ts': 'app.get("/paniers", handler); // paniers sauvegardés',
  'big.txt': 'a'.repeat(25_000),
  ...Object.fromEntries(
    Array.from({ length: 40 }, (_, index) => [
      `src/match-${String(index).padStart(2, '0')}.ts`,
      'const needle = true;',
    ]),
  ),
};

const root = await createTempRepo(files);
afterAll(async () => {
  await removeTempRepo(root);
});

// Contexte sans git : la liste des fichiers est reconstruite à partir du dépôt temporaire.
function contextFor(repo: string): ToolContext {
  const listed: RepoFile[] = Object.keys(files).map((path) => ({
    path,
    size: files[path]?.length ?? 0,
  }));
  return { root: repo, readLog: new ReadLog(), files: () => Promise.resolve(listed) };
}

function toolNamed(name: string) {
  const tool = repoTools.find((candidate) => candidate.name === name);
  if (!tool) {
    throw new Error(`Outil absent : ${name}`);
  }
  return tool;
}

describe('read_file', () => {
  it('tronque les fichiers au-delà de la limite', async () => {
    const result = await toolNamed('read_file').execute({ path: 'big.txt' }, contextFor(root));

    expect(result.isError).toBe(false);
    expect(result.content.length).toBeLessThan(25_000);
    expect(result.content).toContain('fichier tronqué');
  });

  it('refuse un fichier de la liste noire', async () => {
    const result = await toolNamed('read_file').execute({ path: '.env' }, contextFor(root));

    expect(result.isError).toBe(true);
  });

  it("refuse un paramètre invalide sans lancer d'exception", async () => {
    const result = await toolNamed('read_file').execute({}, contextFor(root));

    expect(result.isError).toBe(true);
    expect(result.content).toContain('Paramètres invalides');
  });
});

describe('search_code', () => {
  it('ne renvoie jamais les fichiers de la liste noire', async () => {
    const result = await toolNamed('search_code').execute({ query: 'needle' }, contextFor(root));

    expect(result.content).not.toContain('.env');
    expect(result.content).not.toContain('node_modules');
  });

  it("limite les résultats à 30 correspondances et l'indique", async () => {
    const result = await toolNamed('search_code').execute({ query: 'needle' }, contextFor(root));

    expect(result.content).toContain('seules les 30 premières sont affichées');
    expect(result.content.split('\n---\n')).toHaveLength(31);
  });
});

describe('find_similar_screens', () => {
  it("classe en premier l'écran qui correspond au besoin", async () => {
    const result = await toolNamed('find_similar_screens').execute(
      { need: "Reprendre l'écran « Mes paniers sauvegardés »" },
      contextFor(root),
    );

    expect(result.isError).toBe(false);
    expect(result.content.split('\n')[0]).toContain(
      'apps/web/src/features/paniers/paniers-sauvegardes.tsx',
    );
    expect(result.content).not.toContain('apps/api/');
  });
});

describe('extractKeywords', () => {
  it('garde les mots utiles et retire les accents et les mots courants', () => {
    expect(extractKeywords("Reprendre l'écran « Mes paniers sauvegardés » avec la liste")).toEqual([
      'reprendre',
      'ecran',
      'paniers',
      'sauvegardes',
      'liste',
    ]);
  });
});

it('garde la taille maximale des fichiers cohérente avec le dépôt', () => {
  expect(MAX_FILE_BYTES).toBe(200 * 1024);
});
