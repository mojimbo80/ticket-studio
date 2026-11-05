import { z } from 'zod';

export const ErrorResponseSchema = z.object({
  message: z.string(),
  issues: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
