import { z } from 'zod';

export const HttpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

export const EndpointSchema = z.object({
  method: HttpMethodSchema,
  path: z.string(),
  source: z.string(),
});

export const CommitSummarySchema = z.object({
  shortSha: z.string(),
  author: z.string(),
  date: z.string(),
  subject: z.string(),
});

export const RepoInfoSchema = z.object({
  name: z.string(),
  branch: z.string(),
});

export const ProjectContextSchema = z.object({
  repo: RepoInfoSchema,
  commitSha: z.string(),
  analyzedAt: z.string(),
  readmeSummary: z.string().nullable(),
  commits: z.array(CommitSummarySchema),
  endpoints: z.array(EndpointSchema),
});

export type HttpMethod = z.infer<typeof HttpMethodSchema>;
export type Endpoint = z.infer<typeof EndpointSchema>;
export type CommitSummary = z.infer<typeof CommitSummarySchema>;
export type ProjectContext = z.infer<typeof ProjectContextSchema>;
