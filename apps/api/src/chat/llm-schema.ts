import { type ChatRequest, TicketPatchSchema } from '@ticket-studio/shared';
import { z } from 'zod';

// Réponse du LLM au PM : un message, des écrans repérés (avec leur chemin, vérifié ensuite),
// des réponses rapides et, au besoin, une modification du ticket.
export const ChatReplySchema = z.object({
  message: z.string().trim().min(1),
  references: z
    .array(z.object({ label: z.string(), sourcePath: z.string() }))
    .nullish()
    .transform((value) => value ?? []),
  quickReplies: z
    .array(z.string())
    .nullish()
    .transform((value) => value ?? []),
  patch: TicketPatchSchema.nullish().transform((value) => value ?? null),
});

export type ChatReply = z.infer<typeof ChatReplySchema>;

const HISTORY_TURNS = 12;

// Prompt du chat : ticket courant, historique récent, message du PM, et le format exact attendu.
export function buildChatPrompt(request: ChatRequest): string {
  const { ticket } = request;
  const scenarios =
    ticket.scenarios.length === 0
      ? '(aucun scénario)'
      : ticket.scenarios
          .map(
            (scenario) =>
              `- Given ${scenario.given} / When ${scenario.when} / Then ${scenario.then}`,
          )
          .join('\n');

  const history = request.history
    .slice(-HISTORY_TURNS)
    .map((turn) => `${turn.role === 'user' ? 'PM' : 'Agent'} : ${turn.content}`)
    .join('\n');

  return [
    'Ticket courant :',
    `- Titre : ${ticket.title}`,
    `- Contexte : ${ticket.context || '(vide)'}`,
    `- Description : ${ticket.description || '(vide)'}`,
    `- Scénarios :\n${scenarios}`,
    '',
    history ? `Historique récent :\n${history}\n` : '',
    `Message du PM : ${request.message}`,
    '',
    'Règles :',
    '- Réponds en langage produit. Pas de code, pas de nom de fichier, de route ou de table dans "message".',
    '- "references" : écrans ou composants que tu as repérés en lisant le projet, avec le chemin du fichier lu. Sinon [].',
    '- "quickReplies" : 2 ou 3 réponses courtes que le PM peut cliquer. Sinon [].',
    '- "patch" : une modification du ticket seulement si le PM la demande ou si elle découle clairement de la discussion. Sinon null.',
    '  Types possibles : {"type":"add-scenario","scenario":{"given":"…","when":"…","then":"…"}}, {"type":"add-precision","label":"…","text":"…"}, {"type":"add-open-question","question":"…"}, {"type":"rewrite-section","sectionKey":"context" ou "description","text":"…"}.',
    '',
    'Format exact de la réponse :',
    '{"message":"…","references":[{"label":"Écran …","sourcePath":"chemin/du/fichier"}],"quickReplies":["…","…"],"patch":null}',
  ].join('\n');
}
