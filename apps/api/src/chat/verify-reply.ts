import type { ChatReference, TicketPatch } from '@ticket-studio/shared';
import { containsTechnicalText } from '../suggestions/technical-text';
import type { ChatReply } from './llm-schema';

const MAX_REFERENCES = 3;
const MAX_QUICK_REPLIES = 3;

export interface VerifiedReply {
  message: string;
  references: ChatReference[];
  quickReplies: string[];
  patch: TicketPatch | null;
}

// Vérifie la réponse : un écran n'est cité que s'il a été lu par un outil, et rien de technique
// n'entre dans une réponse rapide ni dans une modification du ticket.
export function verifyReply(raw: ChatReply, readFiles: string[]): VerifiedReply {
  const readSet = new Set(readFiles.map(normalizePath));

  const references = raw.references
    .filter(
      (reference) =>
        readSet.has(normalizePath(reference.sourcePath)) &&
        reference.label.trim() !== '' &&
        !containsTechnicalText(reference.label),
    )
    .slice(0, MAX_REFERENCES)
    .map((reference) => ({ label: reference.label.trim() }));

  const quickReplies = raw.quickReplies
    .map((reply) => reply.trim())
    .filter((reply) => reply !== '' && !containsTechnicalText(reply))
    .slice(0, MAX_QUICK_REPLIES);

  const patch =
    raw.patch !== null && patchTexts(raw.patch).every((text) => !containsTechnicalText(text))
      ? raw.patch
      : null;

  return { message: raw.message, references, quickReplies, patch };
}

// Textes qui entreront dans le ticket : ils ne doivent contenir ni code ni nom technique.
export function patchTexts(patch: TicketPatch): string[] {
  switch (patch.type) {
    case 'add-scenario':
      return [patch.scenario.given, patch.scenario.when, patch.scenario.then];
    case 'add-precision':
      return [patch.label, patch.text];
    case 'add-open-question':
      return [patch.question];
    case 'rewrite-section':
      return [patch.text];
  }
}

function normalizePath(path: string): string {
  return path.trim().replace(/\\/g, '/').replace(/^\.\//, '');
}
