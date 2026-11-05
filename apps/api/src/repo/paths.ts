import { realpath } from 'node:fs/promises';
import path from 'node:path';
import { getExclusionReason } from './blacklist';
import { RepoAccessError } from './errors';

// Vrai si `target` est `base` ou se trouve dans `base` (sans sortir par "..").
export function isInside(base: string, target: string): boolean {
  const relative = path.relative(base, target);
  return (
    relative === '' ||
    (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
  );
}

// Résout un chemin relatif en chemin réel, en refusant tout ce qui sort du clone
// (y compris via un lien symbolique) ou pointe vers un fichier de la liste noire.
export async function resolveRepoFile(root: string, relativePath: string): Promise<string> {
  if (relativePath.trim() === '' || relativePath.includes('\0') || path.isAbsolute(relativePath)) {
    throw new RepoAccessError('OUTSIDE_REPO', 'Chemin hors du dépôt');
  }

  const lexicalPath = path.resolve(root, relativePath);
  if (!isInside(root, lexicalPath)) {
    throw new RepoAccessError('OUTSIDE_REPO', 'Chemin hors du dépôt');
  }
  if (getExclusionReason(path.relative(root, lexicalPath))) {
    throw new RepoAccessError('EXCLUDED', "Fichier exclu de l'analyse");
  }

  const realRoot = await realpath(root);
  let realFile: string;
  try {
    realFile = await realpath(lexicalPath);
  } catch {
    throw new RepoAccessError('NOT_FOUND', 'Fichier introuvable dans le dépôt');
  }

  if (!isInside(realRoot, realFile)) {
    throw new RepoAccessError('OUTSIDE_REPO', 'Lien symbolique hors du dépôt');
  }
  if (getExclusionReason(path.relative(realRoot, realFile))) {
    throw new RepoAccessError('EXCLUDED', "Fichier exclu de l'analyse");
  }

  return realFile;
}
