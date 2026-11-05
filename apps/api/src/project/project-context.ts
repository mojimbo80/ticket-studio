import { type ProjectContext, ProjectContextSchema } from '@ticket-studio/shared';
import { AppError } from '../lib/app-error';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import { summarizeReadme } from '../llm/summarize-readme';
import { repoConfig } from '../repo/config';
import { getHeadCommit, getRecentCommits } from '../repo/commits';
import { extractEndpoints } from '../repo/endpoints';
import { getFileTree } from '../repo/file-tree';
import { getReadme } from '../repo/readme';

const PROJECT_INDEX_ID = 'default';

interface IndexedProject {
  commitSha: string;
  readmeSummary: string | null;
  commits: ProjectContext['commits'];
  endpoints: ProjectContext['endpoints'];
}

// Contexte du projet. L'index n'est recalculé que si le commit courant a changé.
export async function getProjectContext(): Promise<ProjectContext> {
  const root = repoConfig.dir;
  const headCommit = await getHeadCommit(root);

  const stored = await prisma.projectIndex.findUnique({ where: { id: PROJECT_INDEX_ID } });
  if (stored?.commitSha === headCommit) {
    return toProjectContext(stored);
  }

  const indexed = await buildIndex(root, headCommit);
  const saved = await prisma.projectIndex.upsert({
    where: { id: PROJECT_INDEX_ID },
    create: { id: PROJECT_INDEX_ID, ...indexed, analyzedAt: new Date() },
    update: { ...indexed, analyzedAt: new Date() },
  });
  logger.info({ commitSha: headCommit }, 'Index du projet recalculé');
  return toProjectContext(saved);
}

async function buildIndex(root: string, commitSha: string): Promise<IndexedProject> {
  const files = await getFileTree(root);
  const readme = await getReadme(root, files);

  const [commits, endpoints, readmeSummary] = await Promise.all([
    getRecentCommits(root),
    extractEndpoints(root, files),
    readme === null ? Promise.resolve(null) : summarizeReadmeOrFail(readme),
  ]);

  return { commitSha, readmeSummary, commits, endpoints };
}

async function summarizeReadmeOrFail(readme: string): Promise<string> {
  try {
    return await summarizeReadme(readme);
  } catch (error) {
    logger.error({ err: error }, 'Résumé du README impossible');
    throw new AppError(502, "Résumé du README impossible, le service d'analyse ne répond pas");
  }
}

interface StoredProject {
  commitSha: string;
  readmeSummary: string | null;
  commits: unknown;
  endpoints: unknown;
  analyzedAt: Date;
}

// « mojimbo80/plume » à partir de l'URL du dépôt, sans le suffixe .git.
function getRepoName(url: string): string {
  return new URL(url).pathname.replace(/^\/+|\.git$/g, '').replace(/\/+$/, '');
}

function toProjectContext(stored: StoredProject): ProjectContext {
  return ProjectContextSchema.parse({
    repo: { name: getRepoName(repoConfig.url), branch: repoConfig.branch },
    commitSha: stored.commitSha,
    analyzedAt: stored.analyzedAt.toISOString(),
    readmeSummary: stored.readmeSummary,
    commits: stored.commits,
    endpoints: stored.endpoints,
  });
}
