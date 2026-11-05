import { getFileTree, type RepoFile } from '../../repo/file-tree';
import { ReadLog } from '../read-log';
import type { ToolContext } from './define-tool';

// Contexte d'outils pour une requête : le clone, le journal des lectures et la liste des fichiers (mise en cache).
export function createToolContext(root: string): ToolContext {
  let files: Promise<RepoFile[]> | undefined;
  return {
    root,
    readLog: new ReadLog(),
    files: () => (files ??= getFileTree(root)),
  };
}
