import { RepoAccessError } from './errors';
import type { RepoFile } from './file-tree';
import { readRepoFile } from './read-file';

// README à la racine uniquement, « README.md » en priorité.
const README_PATTERN = /^readme(\.(md|markdown|txt))?$/i;

export async function getReadme(root: string, files: RepoFile[]): Promise<string | null> {
  const candidates = files.filter((file) => README_PATTERN.test(file.path));
  const readme = candidates.find((file) => file.path === 'README.md') ?? candidates[0] ?? null;
  if (readme === null) {
    return null;
  }

  try {
    return await readRepoFile(root, readme.path);
  } catch (error) {
    if (error instanceof RepoAccessError) {
      return null;
    }
    throw error;
  }
}
