import type { CommitSummary } from '@ticket-studio/shared';
import { runGit } from './git';

const FIELD_SEPARATOR = '\x1f';
const LOG_FORMAT = ['%H', '%an', '%aI', '%s'].join(FIELD_SEPARATOR);
const DEFAULT_COMMIT_LIMIT = 20;

// Les `limit` derniers commits de la branche courante du clone.
export async function getRecentCommits(
  root: string,
  limit: number = DEFAULT_COMMIT_LIMIT,
): Promise<CommitSummary[]> {
  const output = await runGit(['log', `--max-count=${limit}`, `--format=${LOG_FORMAT}`], {
    cwd: root,
  });

  return output
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => {
      const [sha = '', author = '', date = '', subject = ''] = line.split(FIELD_SEPARATOR);
      return { shortSha: sha.slice(0, 7), author, date, subject };
    });
}

export async function getHeadCommit(root: string): Promise<string> {
  const output = await runGit(['rev-parse', 'HEAD'], { cwd: root });
  return output.trim();
}
