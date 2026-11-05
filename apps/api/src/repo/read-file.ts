import { readFile, stat } from 'node:fs/promises';
import { MAX_FILE_BYTES } from './blacklist';
import { RepoAccessError } from './errors';
import { resolveRepoFile } from './paths';

const BINARY_SAMPLE_BYTES = 8000;

// Lit un fichier du dépôt en texte. Lève une RepoAccessError si le fichier est interdit.
export async function readRepoFile(root: string, relativePath: string): Promise<string> {
  const filePath = await resolveRepoFile(root, relativePath);

  const info = await stat(filePath);
  if (!info.isFile()) {
    throw new RepoAccessError('NOT_FOUND', 'Fichier introuvable dans le dépôt');
  }
  if (info.size > MAX_FILE_BYTES) {
    throw new RepoAccessError('TOO_LARGE', 'Fichier trop volumineux pour être analysé');
  }

  const content = await readFile(filePath);
  if (content.subarray(0, BINARY_SAMPLE_BYTES).includes(0)) {
    throw new RepoAccessError('BINARY', 'Fichier binaire non lisible');
  }

  return content.toString('utf8');
}
