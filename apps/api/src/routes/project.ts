import { ProjectContextSchema } from '@ticket-studio/shared';
import { Router } from 'express';
import { getProjectContext } from '../project/project-context';
import { ensureFreshRepo, syncRepo } from '../repo/sync';

export const projectRouter = Router();

projectRouter.get('/project/context', async (_req, res) => {
  await ensureFreshRepo();
  const context = await getProjectContext();
  res.json(ProjectContextSchema.parse(context));
});

projectRouter.post('/project/reindex', async (_req, res) => {
  await syncRepo();
  const context = await getProjectContext();
  res.json(ProjectContextSchema.parse(context));
});
