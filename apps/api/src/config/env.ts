import { z } from 'zod';

const requiredText = (name: string) => {
  const message = `${name} est requise`;
  return z.string({ error: message }).trim().min(1, message);
};

const envSchema = z.object({
  REPO_URL: z.url({ error: 'REPO_URL doit être une URL valide' }),
  // Le nom de branche est passé à git : on refuse tout caractère inattendu, et un tiret initial.
  REPO_BRANCH: requiredText('REPO_BRANCH').regex(
    /^[A-Za-z0-9._/][A-Za-z0-9._/-]*$/,
    'REPO_BRANCH contient des caractères non autorisés',
  ),
  REPO_DIR: requiredText('REPO_DIR'),
  GITHUB_TOKEN: z
    .string()
    .optional()
    .transform((token) => token || undefined),
  ANTHROPIC_API_KEY: requiredText('ANTHROPIC_API_KEY'),
  LLM_MODEL: requiredText('LLM_MODEL'),
  DATABASE_URL: z.url({ error: 'DATABASE_URL doit être une URL valide' }),
  WEB_ORIGIN: z.url().default('http://localhost:5173'),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')} : ${issue.message}`)
      .join('\n');
    throw new Error(`Configuration invalide, vérifiez le fichier .env :\n${details}`);
  }
  return result.data;
}

export const env = parseEnv(process.env);
