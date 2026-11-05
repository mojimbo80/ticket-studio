// Test manuel : pose une question à l'agent sur le dépôt analysé.
// Usage : pnpm --filter @ticket-studio/api ask "Quels écrans gèrent les paniers ?"
import { askRepo } from '../src/llm/agent';
import { ensureFreshRepo } from '../src/repo/sync';

const question = process.argv.slice(2).join(' ').trim();
if (question === '') {
  console.error('Usage : pnpm --filter @ticket-studio/api ask "votre question"');
  process.exit(1);
}

await ensureFreshRepo();
const result = await askRepo(question);

console.log(result.answer);
console.log(
  `\n--- ${result.toolCalls} appel(s) d'outil ; fichiers lus : ${result.readFiles.join(', ') || 'aucun'}`,
);
