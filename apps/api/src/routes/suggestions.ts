import { SuggestionsResponseSchema, TicketSchema } from '@ticket-studio/shared';
import { Router } from 'express';
import { buildSuggestions } from '../suggestions/build-suggestions';

export const suggestionsRouter = Router();

// Suggestions de l'atelier pour un ticket. Le chemin source est retiré par le schéma de réponse.
suggestionsRouter.post('/suggestions', async (req, res) => {
  const ticket = TicketSchema.parse(req.body);
  const suggestions = await buildSuggestions(ticket);
  res.json(SuggestionsResponseSchema.parse({ suggestions }));
});
