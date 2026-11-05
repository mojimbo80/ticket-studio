import { lstat } from 'node:fs/promises';
import path from 'node:path';
import { getExclusionReason, MAX_FILE_BYTES } from './blacklist';
import { runGit } from './git';

export interface RepoFile {
  path: string;
  size: number;
}

// Fichiers suivis par git, filtrés par la liste noire. Les liens symboliques sont ignorés.
export async function getFileTree(root: string): Promise<RepoFile[]> {
  const output = await runGit(['ls-files', '-z'], { cwd: root });
  const names = output.split('\0').filter(Boolean);

  const files: RepoFile[] = [];
  for (const name of names) {
    if (getExclusionReason(name)) {
      continue;
    }
    const info = await lstat(path.join(root, name)).catch(() => null);
    if (!info?.isFile() || info.size > MAX_FILE_BYTES) {
      continue;
    }
    files.push({ path: name, size: info.size });
  }
  return files;
}
