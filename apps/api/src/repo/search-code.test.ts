import { afterAll, describe, expect, it } from 'vitest';
import { MAX_FILE_BYTES } from './blacklist';
import { searchCode } from './search-code';
import { createTempRepo, removeTempRepo } from './test-helpers';

const NEEDLE = 'needle';

// Chaque fichier contient le terme recherché : seul src/app.ts est autorisé.
const repo = await createTempRepo({
  'src/app.ts': `const value = 1; // ${NEEDLE}\n`,
  '.env': `API_KEY=${NEEDLE}\n`,
  '.env.production': `API_KEY=${NEEDLE}\n`,
  'node_modules/pkg/index.js': `module.exports = '${NEEDLE}';\n`,
  'dist/bundle.js': `var x = '${NEEDLE}';\n`,
  'certs/server.pem': `${NEEDLE}\n`,
  'config/private.key': `${NEEDLE}\n`,
  'pnpm-lock.yaml': `${NEEDLE}\n`,
  'package-lock.json': `${NEEDLE}\n`,
  'assets/logo.png': `${NEEDLE}\n`,
  'docs/huge.md': `${NEEDLE}${'x'.repeat(MAX_FILE_BYTES)}\n`,
});

afterAll(async () => {
  await removeTempRepo(repo);
});

describe('searchCode', () => {
  it('ne renvoie que les fichiers qui ne sont pas dans la liste noire', async () => {
    const matches = await searchCode(repo, NEEDLE);

    expect(matches.map((match) => match.path)).toEqual(['src/app.ts']);
  });

  it('renvoie le numéro de ligne et le texte de la correspondance', async () => {
    const [match] = await searchCode(repo, NEEDLE);

    expect(match).toEqual({
      path: 'src/app.ts',
      line: 1,
      text: `const value = 1; // ${NEEDLE}`,
    });
  });

  it('renvoie une liste vide quand aucun fichier autorisé ne correspond', async () => {
    await expect(searchCode(repo, 'terme-absent-du-depot')).resolves.toEqual([]);
  });

  it('ne lance pas de recherche pour une requête vide', async () => {
    await expect(searchCode(repo, '   ')).resolves.toEqual([]);
  });
});
