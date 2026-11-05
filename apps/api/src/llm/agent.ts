import type { z } from 'zod';
import { env } from '../config/env';
import { repoConfig } from '../repo/config';
import { createAnthropicClient } from './client';
import { Conversation, type MessagesClient } from './conversation';
import { LLM_LIMITS } from './limits';
import { buildProjectMap } from './project-map';
import { runStructured } from './structured';
import { SYSTEM_RULES } from './system-prompt';
import { repoTools } from './tools/repo-tools';
import { createToolContext } from './tools/context';
import type { ReadLog } from './read-log';

export interface AgentOptions {
  root?: string;
  client?: MessagesClient;
  model?: string;
}

export interface AgentSession {
  conversation: Conversation;
  readLog: ReadLog;
}

// Prépare une session : la carte du projet est mise en cache comme contexte système (cache_control).
export async function createAgentSession(options: AgentOptions = {}): Promise<AgentSession> {
  const context = createToolContext(options.root ?? repoConfig.dir);
  const projectMap = buildProjectMap(await context.files());

  const conversation = new Conversation({
    client: options.client ?? createAnthropicClient(),
    model: options.model ?? env.LLM_MODEL,
    system: [
      { type: 'text', text: SYSTEM_RULES },
      { type: 'text', text: projectMap, cache_control: { type: 'ephemeral' } },
    ],
    tools: repoTools,
    context,
    maxToolCalls: LLM_LIMITS.maxToolCalls,
    maxResponseTokens: LLM_LIMITS.maxResponseTokens,
  });

  return { conversation, readLog: context.readLog };
}

export interface AskResult {
  answer: string;
  toolCalls: number;
  readFiles: string[];
}

export async function askRepo(question: string, options: AgentOptions = {}): Promise<AskResult> {
  const session = await createAgentSession(options);
  const answer = await session.conversation.ask(question);
  return {
    answer,
    toolCalls: session.conversation.toolCalls,
    readFiles: session.readLog.list(),
  };
}

export async function askRepoStructured<TSchema extends z.ZodType>(
  prompt: string,
  schema: TSchema,
  options: AgentOptions = {},
): Promise<{ data: z.output<TSchema>; readFiles: string[] }> {
  const session = await createAgentSession(options);
  const data = await runStructured(session.conversation, prompt, schema);
  return { data, readFiles: session.readLog.list() };
}
