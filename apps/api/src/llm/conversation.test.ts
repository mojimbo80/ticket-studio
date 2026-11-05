import type Anthropic from '@anthropic-ai/sdk';
import { afterAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createTempRepo, removeTempRepo } from '../repo/test-helpers';
import { Conversation, ConversationLimitError, type MessagesClient } from './conversation';
import { runStructured, StructuredOutputError } from './structured';
import { createToolContext } from './tools/context';
import { repoTools } from './tools/repo-tools';

const root = await createTempRepo({ 'src/app.ts': 'export const app = 1;' });
afterAll(async () => {
  await removeTempRepo(root);
});

function message(content: Anthropic.ContentBlock[], stopReason: string): Anthropic.Message {
  return {
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    model: 'test-model',
    content,
    stop_reason: stopReason,
    stop_sequence: null,
    usage: {
      input_tokens: 10,
      output_tokens: 5,
      cache_creation_input_tokens: null,
      cache_read_input_tokens: null,
    },
  } as unknown as Anthropic.Message;
}

function text(value: string): Anthropic.ContentBlock {
  return { type: 'text', text: value, citations: null } as unknown as Anthropic.ContentBlock;
}

function toolUse(name: string, input: Record<string, unknown>): Anthropic.ContentBlock {
  return {
    type: 'tool_use',
    id: `toolu_${name}`,
    name,
    input,
  } as unknown as Anthropic.ContentBlock;
}

// Client factice : renvoie les réponses scénarisées, et garde les paramètres de chaque appel.
function scriptedClient(responses: Anthropic.Message[]) {
  const calls: Anthropic.MessageCreateParamsNonStreaming[] = [];
  const client: MessagesClient = {
    messages: {
      create: (params) => {
        calls.push(structuredClone(params));
        const next = responses.shift();
        return next ? Promise.resolve(next) : Promise.reject(new Error('plus de réponse prévue'));
      },
    },
  };
  return { client, calls };
}

function conversationWith(client: MessagesClient, maxToolCalls = 12) {
  const context = createToolContext(root);
  const conversation = new Conversation({
    client,
    model: 'test-model',
    system: [{ type: 'text', text: 'Règles de test' }],
    tools: repoTools,
    context,
    maxToolCalls,
    maxResponseTokens: 100,
  });
  return { conversation, readLog: context.readLog };
}

describe('Conversation', () => {
  it('exécute un outil demandé par le modèle, puis renvoie la réponse finale', async () => {
    const { client, calls } = scriptedClient([
      message([toolUse('read_file', { path: 'src/app.ts' })], 'tool_use'),
      message([text('Réponse finale')], 'end_turn'),
    ]);
    const { conversation, readLog } = conversationWith(client);

    const answer = await conversation.ask('Que fait le fichier ?');

    expect(answer).toBe('Réponse finale');
    expect(conversation.toolCalls).toBe(1);
    expect(readLog.list()).toEqual(['src/app.ts']);
    expect(JSON.stringify(calls[1]?.messages)).toContain('export const app = 1;');
  });

  it("s'arrête quand le nombre d'appels d'outils est atteint", async () => {
    const endlessToolUse = {
      messages: {
        create: () => Promise.resolve(message([toolUse('get_project_map', {})], 'tool_use')),
      },
    };
    const { conversation } = conversationWith(endlessToolUse, 2);

    await expect(conversation.ask('Question')).rejects.toBeInstanceOf(ConversationLimitError);
    expect(conversation.toolCalls).toBe(2);
  });

  it("renvoie une erreur d'outil pour un nom d'outil inconnu", async () => {
    const { client, calls } = scriptedClient([
      message([toolUse('inconnu', {})], 'tool_use'),
      message([text('Fin')], 'end_turn'),
    ]);
    const { conversation } = conversationWith(client);

    await conversation.ask('Question');

    expect(JSON.stringify(calls[1]?.messages)).toContain('Outil inconnu : inconnu');
  });
});

describe('runStructured', () => {
  const schema = z.object({ title: z.string() });

  it("relance une fois avec l'erreur quand le JSON est invalide", async () => {
    const { client, calls } = scriptedClient([
      message([text('Voici le résultat : pas du JSON')], 'end_turn'),
      message([text('{"title":"Archiver les commandes"}')], 'end_turn'),
    ]);
    const { conversation } = conversationWith(client);

    const data = await runStructured(conversation, 'Propose un titre', schema);

    expect(data).toEqual({ title: 'Archiver les commandes' });
    expect(calls).toHaveLength(2);
    expect(JSON.stringify(calls[1]?.messages)).toContain('pas du JSON valide');
  });

  it('relance quand le JSON ne respecte pas le schéma', async () => {
    const { client } = scriptedClient([
      message([text('{"title":42}')], 'end_turn'),
      message([text('```json\n{"title":"Ok"}\n```')], 'end_turn'),
    ]);
    const { conversation } = conversationWith(client);

    await expect(runStructured(conversation, 'Titre', schema)).resolves.toEqual({ title: 'Ok' });
  });

  it('échoue après la relance si la réponse reste invalide', async () => {
    const { client } = scriptedClient([
      message([text('pas du JSON')], 'end_turn'),
      message([text('toujours pas du JSON')], 'end_turn'),
    ]);
    const { conversation } = conversationWith(client);

    await expect(runStructured(conversation, 'Titre', schema)).rejects.toBeInstanceOf(
      StructuredOutputError,
    );
  });
});
