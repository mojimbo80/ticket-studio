import type { RepoFile } from '../repo/file-tree';

const MAX_LISTED_PATHS = 400;

// Carte compacte du dépôt : dossiers principaux et premiers fichiers suivis. Sert de contexte mis en cache.
export function buildProjectMap(files: RepoFile[]): string {
  const lines = [`Carte du dépôt : ${files.length} fichiers suivis.`, '', 'Dossiers principaux :'];

  for (const [directory, count] of countByTopLevelDirectory(files)) {
    lines.push(`- ${directory} (${count} fichiers)`);
  }

  lines.push('', 'Fichiers :');
  for (const file of files.slice(0, MAX_LISTED_PATHS)) {
    lines.push(`- ${file.path}`);
  }
  if (files.length > MAX_LISTED_PATHS) {
    lines.push(
      `… et ${files.length - MAX_LISTED_PATHS} autres fichiers : utilise les outils pour les explorer.`,
    );
  }

  return lines.join('\n');
}

function countByTopLevelDirectory(files: RepoFile[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const file of files) {
    const separator = file.path.indexOf('/');
    const directory = separator === -1 ? '(racine)' : `${file.path.slice(0, separator)}/`;
    counts.set(directory, (counts.get(directory) ?? 0) + 1);
  }
  return new Map([...counts].sort((a, b) => b[1] - a[1]));
}
