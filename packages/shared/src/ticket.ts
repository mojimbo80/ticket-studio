import { z } from 'zod';

export const TicketTypeSchema = z.enum(['story', 'bug', 'tech']);

// Un scénario de critère d'acceptation : les trois parties sont obligatoires dès qu'il existe.
export const ScenarioSchema = z.object({
  given: z.string().trim().min(1, 'Renseignez la situation de départ'),
  when: z.string().trim().min(1, "Renseignez l'action de l'utilisateur"),
  then: z.string().trim().min(1, 'Renseignez le résultat attendu'),
});

export const TicketSchema = z.object({
  type: TicketTypeSchema,
  title: z.string().trim().min(1, 'Le titre est obligatoire').max(200, 'Titre trop long'),
  context: z.string().trim(),
  description: z.string().trim(),
  scenarios: z.array(ScenarioSchema),
  links: z.array(z.url({ error: 'Lien invalide' })),
});

export type TicketType = z.infer<typeof TicketTypeSchema>;
export type Scenario = z.infer<typeof ScenarioSchema>;
export type Ticket = z.infer<typeof TicketSchema>;
