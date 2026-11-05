export type RepoAccessCode = 'OUTSIDE_REPO' | 'EXCLUDED' | 'NOT_FOUND' | 'TOO_LARGE' | 'BINARY';

// Refus d'accès à un fichier du dépôt : le code permet de distinguer les cas.
export class RepoAccessError extends Error {
  readonly code: RepoAccessCode;

  constructor(code: RepoAccessCode, message: string) {
    super(message);
    this.name = 'RepoAccessError';
    this.code = code;
  }
}

export class GitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitError';
  }
}
