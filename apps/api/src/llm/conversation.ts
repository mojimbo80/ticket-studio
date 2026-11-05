import type Anthropic from '@anthropic-ai/sdk';
import { logger } from '../lib/logger';
import type { RuntimeTool, ToolContext } from './tools/define-tool';

// Dépendance minimale vers le SDK : permet de remplacer le client réel par un faux dans les tests.
export interface MessagesClient {
  messages: {
    create: (params: Anthropic.MessageCreateParamsNonStreaming) => Promise<Anthropic.Message>;
  };
}

export interface ConversationOptions {
  client: MessagesClient;
  model: string;
  system: Anthropic.TextBlockParam[];
  tools: RuntimeTool[];
  context: ToolContext;
  maxToolCalls: number;
  maxResponseTokens: number;
  // Appelé avant chaque outil exécuté, pour informer le client de la progression.
  onToolCall?: (toolName: string) => void;
}

export class ConversationLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConversationLimitError';
  }
}

// Une conversation avec l'agent : chaque appel à ask() boucle sur les outils jusqu'à une réponse texte.
export class Conversation {
  private readonly messages: Anthropic.MessageParam[] = [];
  private toolCallCount = 0;

  constructor(private readonly options: ConversationOptions) {}

  get toolCalls(): number {
    return this.toolCallCount;
  }

  async ask(content: string): Promise<string> {
    this.messages.push({ role: 'user', content });

    // Une étape par appel d'outil, plus la réponse finale et une marge pour le refus d'outils.
    const maxRounds = this.options.maxToolCalls + 2;
    for (let round = 0; round < maxRounds; round++) {
      const response = await this.send();
      this.messages.push({ role: 'assistant', content: response.content });

      if (response.stop_reason !== 'tool_use') {
        return extractText(response.content);
      }
      this.messages.push({ role: 'user', content: await this.runToolUses(response.content) });
    }

    throw new ConversationLimitError(
      "La réponse de l'agent a dépassé le nombre d'étapes autorisé.",
    );
  }

  private async send(): Promise<Anthropic.Message> {
    const response = await this.options.client.messages.create({
      model: this.options.model,
      max_tokens: this.options.maxResponseTokens,
      system: this.options.system,
      tools: this.options.tools.map((tool) => tool.definition),
      messages: this.messages,
    });

    // Usage et durée uniquement : aucun contenu n'est journalisé.
    logger.info(
      {
        stopReason: response.stop_reason,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
        cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
      },
      'Appel LLM',
    );
    return response;
  }

  private async runToolUses(
    content: Anthropic.ContentBlock[],
  ): Promise<Anthropic.ToolResultBlockParam[]> {
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const block of content) {
      if (block.type === 'tool_use') {
        results.push(await this.runToolUse(block));
      }
    }
    return results;
  }

  private async runToolUse(block: Anthropic.ToolUseBlock): Promise<Anthropic.ToolResultBlockParam> {
    if (this.toolCallCount >= this.options.maxToolCalls) {
      return toolResult(
        block.id,
        "Limite d'appels d'outils atteinte : réponds avec les informations déjà obtenues.",
        true,
      );
    }
    this.toolCallCount += 1;

    const tool = this.options.tools.find((candidate) => candidate.name === block.name);
    if (!tool) {
      return toolResult(block.id, `Outil inconnu : ${block.name}`, true);
    }

    this.options.onToolCall?.(tool.name);
    const startedAt = Date.now();
    const result = await tool.execute(block.input, this.options.context);
    // Nom de l'outil, statut et taille seulement : ni les paramètres ni le contenu lu ne sont journalisés.
    logger.info(
      {
        tool: tool.name,
        ok: !result.isError,
        durationMs: Date.now() - startedAt,
        resultChars: result.content.length,
      },
      'Outil exécuté',
    );
    return toolResult(block.id, result.content, result.isError);
  }
}

function toolResult(
  toolUseId: string,
  content: string,
  isError: boolean,
): Anthropic.ToolResultBlockParam {
  return { type: 'tool_result', tool_use_id: toolUseId, content, is_error: isError };
}

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .flatMap((block) => (block.type === 'text' ? [block.text] : []))
    .join('')
    .trim();
}
