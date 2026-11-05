import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env';

// Racine du monorepo : REPO_DIR est relatif à ce dossier, quel que soit le dossier de lancement.
const MONOREPO_ROOT = fileURLToPath(new URL('../../../../', import.meta.url));

export const repoConfig = {
  url: env.REPO_URL,
  branch: env.REPO_BRANCH,
  dir: path.resolve(MONOREPO_ROOT, env.REPO_DIR),
  token: env.GITHUB_TOKEN,
};
