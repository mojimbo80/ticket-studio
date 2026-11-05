import type { z } from 'zod';
import type { Conversation } from './conversation';

const JSON_INSTRUCTION =
  'Réponds uniquement avec un objet JSON valide, sans texte ni balise autour.';

export class StructuredOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StructuredOutputError';
  }
}

type Validation<T> = { ok: true; data: T } | { ok: false; error: string };

// Demande une réponse JSON, la valide avec le schéma, et relance une fois avec l'erreur si elle est invalide.
export async function runStructured<TSchema extends z.ZodType>(
  conversation: Conversation,
  prompt: string,
  schema: TSchema,
): Promise<z.output<TSchema>> {
  const first = validate(await conversation.ask(`${prompt}\n\n${JSON_INSTRUCTION}`), schema);
  if (first.ok) {
    return first.data;
  }

  const retry = validate(
    await conversation.ask(
      `Ta réponse n'est pas valide : ${first.error}. Renvoie uniquement le JSON corrigé, en respectant le schéma demandé.`,
    ),
    schema,
  );
  if (retry.ok) {
    return retry.data;
  }
  throw new StructuredOutputError(`Réponse structurée invalide après une relance : ${retry.error}`);
}

// Accepte un JSON entouré de balises de code markdown, fréquent dans les réponses.
export function parseJsonText(text: string): unknown {
  const unfenced = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  return JSON.parse(unfenced);
}

function validate<TSchema extends z.ZodType>(
  text: string,
  schema: TSchema,
): Validation<z.output<TSchema>> {
  let json: unknown;
  try {
    json = parseJsonText(text);
  } catch {
    return { ok: false, error: "le texte n'est pas du JSON valide" };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '(racine)'} : ${issue.message}`)
      .join(' ; ');
    return { ok: false, error: `le JSON ne respecte pas le schéma (${details})` };
  }
  return { ok: true, data: parsed.data };
}
