import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';

const MAX_README_CHARS = 20_000;
const MAX_OUTPUT_TOKENS = 400;

const SYSTEM_PROMPT = [
  "Tu résumes le README d'un projet pour un chef de produit.",
  'Réponds en français, en 3 à 5 phrases, avec un vocabulaire de produit.',
  'Ne cite ni extrait de code, ni nom de fichier, ni nom de fonction, ni nom de table.',
].join(' ');

let client: Anthropic | undefined;

export async function summarizeReadme(readme: string): Promise<string> {
  client ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: env.LLM_MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: readme.slice(0, MAX_README_CHARS) }],
  });

  return response.content
    .flatMap((block) => (block.type === 'text' ? [block.text] : []))
    .join('')
    .trim();
}
