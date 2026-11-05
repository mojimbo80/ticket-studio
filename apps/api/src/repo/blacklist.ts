export const MAX_FILE_BYTES = 200 * 1024;

const EXCLUDED_DIRECTORIES = ['.git', 'node_modules', 'dist', 'build'];

const LOCKFILE_NAMES = [
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
  'bun.lock',
  'cargo.lock',
  'composer.lock',
  'gemfile.lock',
  'poetry.lock',
  'pipfile.lock',
  'uv.lock',
  'go.sum',
];

const SECRET_FILE_NAMES = ['id_rsa', 'id_dsa', 'id_ecdsa', 'id_ed25519', '.npmrc', '.netrc'];
const SECRET_EXTENSIONS = [
  '.pem',
  '.key',
  '.p12',
  '.pfx',
  '.crt',
  '.cer',
  '.der',
  '.jks',
  '.keystore',
];

const BINARY_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.bmp',
  '.pdf',
  '.zip',
  '.gz',
  '.tgz',
  '.tar',
  '.7z',
  '.rar',
  '.jar',
  '.war',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.bin',
  '.class',
  '.pyc',
  '.wasm',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',
  '.mp3',
  '.mp4',
  '.mov',
  '.avi',
  '.sqlite',
  '.db',
];

export type ExclusionReason = 'excluded-directory' | 'lockfile' | 'env-file' | 'secret' | 'binary';

// Décide si un chemin relatif au dépôt est interdit de lecture et de recherche.
// La taille n'est pas évaluée ici : elle nécessite un accès disque (voir MAX_FILE_BYTES).
export function getExclusionReason(relativePath: string): ExclusionReason | null {
  const segments = relativePath.split(/[\\/]/).filter(Boolean);
  const name = (segments[segments.length - 1] ?? '').toLowerCase();
  const directories = segments.slice(0, -1);

  if (directories.some((directory) => EXCLUDED_DIRECTORIES.includes(directory))) {
    return 'excluded-directory';
  }
  if (LOCKFILE_NAMES.includes(name) || /\.lock$/.test(name) || /-lock\.(json|yaml)$/.test(name)) {
    return 'lockfile';
  }
  if (name === '.env' || name.startsWith('.env.')) {
    return 'env-file';
  }
  if (
    SECRET_FILE_NAMES.includes(name) ||
    SECRET_EXTENSIONS.some((extension) => name.endsWith(extension)) ||
    /^id_[a-z0-9]+(\.pub)?$/.test(name)
  ) {
    return 'secret';
  }
  if (BINARY_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    return 'binary';
  }
  return null;
}

// Mêmes règles, sous forme de filtres pour ripgrep, pour ne pas même les ouvrir.
export function getRipgrepExcludeGlobs(): string[] {
  const patterns = [
    ...EXCLUDED_DIRECTORIES.map((directory) => `**/${directory}/**`),
    ...LOCKFILE_NAMES.map((name) => `**/${name}`),
    '**/*.lock',
    '**/*-lock.json',
    '**/*-lock.yaml',
    '**/.env*',
    ...SECRET_FILE_NAMES.map((name) => `**/${name}`),
    ...SECRET_EXTENSIONS.map((extension) => `**/*${extension}`),
    ...BINARY_EXTENSIONS.map((extension) => `**/*${extension}`),
  ];
  return patterns.map((pattern) => `!${pattern}`);
}
