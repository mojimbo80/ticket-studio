import { symlink } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { MAX_FILE_BYTES } from './blacklist';
import { createTempRepo, removeTempRepo } from './test-helpers';
import { readRepoFile } from './read-file';

const outside = await createTempRepo({ 'outside.txt': 'hors du dépôt' });
const repo = await createTempRepo({
  'README.md': '# Projet',
  'src/app.ts': 'export const app = 1;',
  '.env': 'SECRET=1',
  'certs/server.pem': '-----BEGIN CERTIFICATE-----',
  'node_modules/pkg/index.js': 'module.exports = 1;',
  'big.txt': 'a'.repeat(MAX_FILE_BYTES + 1),
  'nul.txt': Buffer.from([72, 0, 105]),
});

// Les liens symboliques demandent un droit spécifique sous Windows : on vérifie qu'ils sont créables.
const symlinksSupported = await createSymlinks();

async function createSymlinks(): Promise<boolean> {
  try {
    await symlink(path.join(outside, 'outside.txt'), path.join(repo, 'link-out.txt'), 'file');
    await symlink(path.join(repo, '.env'), path.join(repo, 'link-env.txt'), 'file');
    await symlink(path.join(repo, 'src/app.ts'), path.join(repo, 'link-in.ts'), 'file');
    return true;
  } catch {
    return false;
  }
}

afterAll(async () => {
  await removeTempRepo(repo);
  await removeTempRepo(outside);
});

describe('readRepoFile', () => {
  it('lit un fichier autorisé du dépôt', async () => {
    await expect(readRepoFile(repo, 'src/app.ts')).resolves.toBe('export const app = 1;');
  });

  it.each([
    ['un chemin qui remonte avec ".."', '../outside.txt'],
    ['un chemin qui remonte après un dossier', 'src/../../outside.txt'],
    ['un chemin absolu hors du dépôt', path.join(outside, 'outside.txt')],
    ['un chemin vide', ''],
  ])('refuse %s', async (_label, relativePath) => {
    await expect(readRepoFile(repo, relativePath)).rejects.toMatchObject({
      code: 'OUTSIDE_REPO',
    });
  });

  it.each([
    ['le fichier .env', '.env'],
    ['un certificat', 'certs/server.pem'],
    ['un fichier de node_modules', 'node_modules/pkg/index.js'],
  ])('refuse %s de la liste noire', async (_label, relativePath) => {
    await expect(readRepoFile(repo, relativePath)).rejects.toMatchObject({ code: 'EXCLUDED' });
  });

  it('refuse un fichier de plus de 200 Ko', async () => {
    await expect(readRepoFile(repo, 'big.txt')).rejects.toMatchObject({ code: 'TOO_LARGE' });
  });

  it('refuse un fichier binaire', async () => {
    await expect(readRepoFile(repo, 'nul.txt')).rejects.toMatchObject({ code: 'BINARY' });
  });

  it('signale un fichier absent', async () => {
    await expect(readRepoFile(repo, 'src/absent.ts')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it.skipIf(!symlinksSupported)('refuse un lien symbolique qui sort du dépôt', async () => {
    await expect(readRepoFile(repo, 'link-out.txt')).rejects.toMatchObject({
      code: 'OUTSIDE_REPO',
    });
  });

  it.skipIf(!symlinksSupported)(
    'refuse un lien symbolique vers un fichier de la liste noire',
    async () => {
      await expect(readRepoFile(repo, 'link-env.txt')).rejects.toMatchObject({
        code: 'EXCLUDED',
      });
    },
  );

  it.skipIf(!symlinksSupported)('accepte un lien symbolique qui reste dans le dépôt', async () => {
    await expect(readRepoFile(repo, 'link-in.ts')).resolves.toBe('export const app = 1;');
  });
});
