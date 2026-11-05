import type { ChatEvent, ChatRequest } from '@ticket-studio/shared';
import { createAgentSession } from '../llm/agent';
import { AppError } from '../lib/app-error';
import { logger } from '../lib/logger';
import { runStructured } from '../llm/structured';
import { buildChatPrompt, ChatReplySchema } from './llm-schema';
import { verifyReply } from './verify-reply';

// Libellés affichés pendant qu'un outil travaille : jamais le nom technique de l'outil.
const TOOL_LABELS: Record<string, string> = {
  get_project_map: 'Lecture de la carte du projet…',
  search_code: 'Recherche dans le code…',
  read_file: 'Lecture d’un fichier…',
  list_endpoints: 'Inventaire des points d’entrée…',
  get_recent_commits: 'Lecture des commits récents…',
  find_similar_screens: 'Recherche d’écrans proches…',
};

// Un tour de conversation : l'agent reçoit le ticket, l'historique et ses outils, puis répond.
export async function runChat(
  request: ChatRequest,
  emit: (event: ChatEvent) => void,
  isCancelled: () => boolean,
): Promise<void> {
  emit({ type: 'progress', label: 'L’agent réfléchit…' });

  const session = await createAgentSession({
    onToolCall: (toolName) => {
      if (!isCancelled()) {
        emit({ type: 'progress', label: TOOL_LABELS[toolName] ?? 'Recherche dans le projet…' });
      }
    },
  });

  let raw;
  try {
    raw = await runStructured(session.conversation, buildChatPrompt(request), ChatReplySchema);
  } catch (error) {
    logger.error({ err: error }, 'Réponse du chat échouée');
    throw new AppError(502, 'L’agent n’a pas pu répondre, réessayez dans un instant.');
  }

  emit({ type: 'message', ...verifyReply(raw, session.readLog.list()) });
  emit({ type: 'done' });
}
