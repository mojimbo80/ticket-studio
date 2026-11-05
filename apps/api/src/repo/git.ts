import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { GitError } from './errors';

const execFileAsync = promisify(execFile);
const MAX_OUTPUT_BYTES = 50 * 1024 * 1024;

interface GitOptions {
  cwd: string;
  token?: string | undefined;
}

// Le token n'est jamais écrit dans l'URL ni dans .git/config : il passe par un en-tête
// d'authentification fourni sur la ligne de commande, uniquement pour cet appel.
function buildAuthArgs(token: string | undefined): string[] {
  if (!token) {
    return [];
  }
  return ['-c', `http.extraHeader=Authorization: Basic ${encodeCredentials(token)}`];
}

function encodeCredentials(token: string): string {
  return Buffer.from(`x-access-token:${token}`).toString('base64');
}

// Retire le token, et son encodage, de tout texte qui pourrait être affiché ou journalisé.
export function redact(text: string, token: string | undefined): string {
  if (!token) {
    return text;
  }
  return text.split(token).join('***').split(encodeCredentials(token)).join('***');
}

// Exécute git sans shell. Le message d'erreur ne contient ni les arguments ni le token.
export async function runGit(args: string[], options: GitOptions): Promise<string> {
  const subcommand = args[0] ?? '';
  try {
    const { stdout } = await execFileAsync('git', [...buildAuthArgs(options.token), ...args], {
      cwd: options.cwd,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
      maxBuffer: MAX_OUTPUT_BYTES,
      encoding: 'utf8',
    });
    return stdout;
  } catch (error) {
    if (isNodeError(error, 'ENOENT')) {
      throw new GitError('git doit être installé sur le serveur');
    }
    const detail = error instanceof Error ? (getStderr(error) ?? error.message) : String(error);
    throw new GitError(`git ${subcommand} a échoué : ${redact(detail.trim(), options.token)}`);
  }
}

function isNodeError(error: unknown, code: string): boolean {
  return error instanceof Error && 'code' in error && error.code === code;
}

function getStderr(error: Error): string | undefined {
  return 'stderr' in error && typeof error.stderr === 'string' ? error.stderr : undefined;
}
