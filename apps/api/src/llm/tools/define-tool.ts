import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { RepoFile } from '../../repo/file-tree';
import type { ReadLog } from '../read-log';

export interface ToolContext {
  root: string;
  readLog: ReadLog;
  // Liste des fichiers suivis, calculée une seule fois par requête.
  files: () => Promise<RepoFile[]>;
}

export interface ToolResult {
  content: string;
  isError: boolean;
}

// Outil exposé au modèle, sous une forme indépendante de son schéma Zod d'origine.
export interface RuntimeTool {
  name: string;
  definition: Anthropic.Tool;
  execute: (input: unknown, context: ToolContext) => Promise<ToolResult>;
}

interface ToolSpec<TSchema extends z.ZodType> {
  name: string;
  description: string;
  schema: TSchema;
  run: (input: z.output<TSchema>, context: ToolContext) => Promise<string>;
}

// Valide les paramètres avant exécution. Une erreur devient un résultat d'outil, jamais une exception.
export function defineTool<TSchema extends z.ZodType>(spec: ToolSpec<TSchema>): RuntimeTool {
  return {
    name: spec.name,
    definition: {
      name: spec.name,
      description: spec.description,
      input_schema: toInputSchema(spec.schema),
    },
    async execute(input, context) {
      const parsed = spec.schema.safeParse(input);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => issue.message).join(' ; ');
        return { content: `Paramètres invalides : ${details}`, isError: true };
      }
      try {
        const content = await spec.run(parsed.data, context);
        return { content, isError: false };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        return { content: message, isError: true };
      }
    },
  };
}

function toInputSchema(schema: z.ZodType): Anthropic.Tool.InputSchema {
  const json: Record<string, unknown> = { ...z.toJSONSchema(schema) };
  delete json.$schema;
  return { ...json, type: 'object' };
}
