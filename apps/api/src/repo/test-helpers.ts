import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// Crée un dépôt temporaire à partir d'une liste { chemin relatif : contenu }.
export async function createTempRepo(files: Record<string, string | Buffer>): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'ticket-studio-repo-'));
  for (const [relativePath, content] of Object.entries(files)) {
    const target = path.join(root, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
  return root;
}

export async function removeTempRepo(root: string): Promise<void> {
  await rm(root, { recursive: true, force: true });
}
