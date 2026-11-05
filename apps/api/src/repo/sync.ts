import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { AppError } from '../lib/app-error';
import { logger } from '../lib/logger';
import { repoConfig } from './config';
import { runGit } from './git';

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const CLONE_DEPTH = 50;

// Verrou : une seule opération git sur le clone à la fois, dans l'ordre d'arrivée.
let queue: Promise<void> = Promise.resolve();
// Date de la dernière synchronisation réussie.
let lastSyncAt: number | null = null;

function runExclusive(task: () => Promise<void>): Promise<void> {
  const run = queue.then(task);
  queue = run.catch(() => undefined);
  return run;
}

async function cloneRepo(): Promise<void> {
  const parentDir = path.dirname(repoConfig.dir);
  await mkdir(parentDir, { recursive: true });
  await runGit(
    [
      'clone',
      '--depth',
      String(CLONE_DEPTH),
      '--branch',
      repoConfig.branch,
      '--single-branch',
      repoConfig.url,
      repoConfig.dir,
    ],
    { cwd: parentDir, token: repoConfig.token },
  );
}

async function fetchLatest(): Promise<void> {
  const { branch } = repoConfig;
  await runGit(
    [
      'fetch',
      '--depth',
      String(CLONE_DEPTH),
      'origin',
      `+refs/heads/${branch}:refs/remotes/origin/${branch}`,
    ],
    { cwd: repoConfig.dir, token: repoConfig.token },
  );
  await runGit(['reset', '--hard', `origin/${branch}`], { cwd: repoConfig.dir });
}

async function synchronize(maxAgeMs: number): Promise<void> {
  const isFresh =
    lastSyncAt !== null && Date.now() - lastSyncAt < maxAgeMs && existsSync(repoConfig.dir);
  if (isFresh) {
    return;
  }

  try {
    if (existsSync(repoConfig.dir)) {
      await fetchLatest();
    } else {
      await cloneRepo();
    }
    lastSyncAt = Date.now();
    logger.info({ branch: repoConfig.branch }, 'Dépôt synchronisé');
  } catch (error) {
    logger.error({ err: error }, 'Synchronisation du dépôt échouée');
    throw new AppError(
      502,
      'Synchronisation du dépôt impossible, vérifiez la configuration du dépôt',
    );
  }
}

// Clone le dépôt s'il est absent, sinon le met à jour. Appelée au démarrage et par « Ré-analyser ».
export function syncRepo(): Promise<void> {
  return runExclusive(() => synchronize(0));
}

// Ne synchronise que si la dernière synchronisation date de plus de 5 minutes.
export function ensureFreshRepo(): Promise<void> {
  return runExclusive(() => synchronize(FIVE_MINUTES_MS));
}
