import { z } from 'zod';
import { ScenarioSchema, TicketSchema } from './ticket';

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(4000),
});

// Modification proposée par l'agent. Le PM la valide avec « Appliquer » ou la rejette avec « Ignorer ».
export const TicketPatchSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('add-scenario'), scenario: ScenarioSchema }),
  z.object({
    type: z.literal('add-precision'),
    label: z.string().trim().min(1),
    text: z.string().trim().min(1),
  }),
  z.object({ type: z.literal('add-open-question'), question: z.string().trim().min(1) }),
  z.object({
    type: z.literal('rewrite-section'),
    sectionKey: z.enum(['context', 'description']),
    text: z.string().trim().min(1),
  }),
]);

// Écran ou composant repéré par l'agent, affiché sous forme de libellé (le chemin reste côté serveur).
export const ChatReferenceSchema = z.object({ label: z.string() });

export const ChatRequestSchema = z.object({
  ticket: TicketSchema,
  history: z.array(ChatMessageSchema).max(40),
  message: z.string().trim().min(1).max(2000),
});

export const ChatEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('progress'), label: z.string() }),
  z.object({
    type: z.literal('message'),
    message: z.string(),
    references: z.array(ChatReferenceSchema),
    quickReplies: z.array(z.string()),
    patch: TicketPatchSchema.nullable(),
  }),
  z.object({ type: z.literal('error'), message: z.string() }),
  z.object({ type: z.literal('done') }),
]);

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type TicketPatch = z.infer<typeof TicketPatchSchema>;
export type ChatReference = z.infer<typeof ChatReferenceSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatEvent = z.infer<typeof ChatEventSchema>;
