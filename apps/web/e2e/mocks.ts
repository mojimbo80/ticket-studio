import type { Page, Route } from '@playwright/test';

// Réponses simulées de l'API et du LLM. Chaque fixture respecte le schéma partagé correspondant.

const PROJECT_CONTEXT = {
  repo: { name: 'shop-api', branch: 'main' },
  commitSha: '8f2c1a4b7d9e0f1234567890abcdef12345678',
  analyzedAt: '2026-11-05T10:00:00.000Z',
  readmeSummary: 'API d’une boutique en ligne : catalogue, panier, commandes et livraison.',
  commits: [
    {
      shortSha: '8f2c1a4',
      author: 'Julie Martin',
      date: '2026-11-02T10:00:00.000Z',
      subject: 'Création des remboursements partiels',
    },
  ],
  endpoints: [{ method: 'GET', path: '/orders', source: 'src/orders/orders.routes.ts' }],
};

const DIAGNOSTIC = {
  status: 'presque-pret',
  blockers: 2,
  recommendations: 1,
  sections: [
    { key: 'title', label: 'Titre', filled: true },
    { key: 'context', label: 'Contexte', filled: false },
    { key: 'description', label: 'Description', filled: false },
    { key: 'criteria', label: "Critères d'acceptation", filled: false },
  ],
  issues: [
    {
      id: 'section-vide-context',
      kind: 'section-vide',
      severity: 'bloquant',
      message: 'La section « Contexte » est vide',
      sectionKey: 'context',
    },
    {
      id: 'ambiguite-terminées',
      kind: 'ambiguite',
      severity: 'bloquant',
      message: 'Le terme « terminées » peut désigner plusieurs réalités',
      term: 'terminées',
    },
    {
      id: 'absence-lien-maquette',
      kind: 'absence-lien-maquette',
      severity: 'recommandation',
      message: 'Aucun lien de maquette ou de ticket lié',
    },
  ],
  proposals: [],
};

const SUGGESTIONS = {
  suggestions: [
    {
      id: 'suggestion-1',
      kind: 'preciser',
      importance: 'haute',
      title: 'Quelles commandes sont « terminées » ?',
      body: 'Une commande passe par plusieurs étapes. Lesquelles peut-on archiver ?',
      sourceLabel: 'Cycle de vie des commandes',
      answers: ['Livrées et annulées', 'Toutes'],
    },
  ],
};

const ANALYSIS_EVENTS = [
  { type: 'progress', step: 'documentation', status: 'running' },
  { type: 'progress', step: 'documentation', status: 'done', detail: 'Résumé disponible' },
  { type: 'progress', step: 'donnees', status: 'done', detail: '1 endpoint recensé' },
  { type: 'progress', step: 'evolutions', status: 'done', detail: '1 commit récent' },
  { type: 'progress', step: 'ecrans', status: 'done', detail: 'Aucun écran proche trouvé' },
  { type: 'progress', step: 'sections', status: 'done', detail: '1 section sur 4 remplie' },
  { type: 'done', diagnostic: DIAGNOSTIC },
];

const CHAT_EVENTS = [
  { type: 'progress', label: 'Recherche dans le code…' },
  {
    type: 'message',
    message: 'Je propose de demander si les commandes archivées restent visibles au support.',
    references: [{ label: 'Écran Mes paniers sauvegardés' }],
    quickReplies: ['Oui, toujours visibles', 'Non, masquées'],
    patch: {
      type: 'add-open-question',
      question: 'Les commandes archivées restent-elles visibles au support ?',
    },
  },
  { type: 'done' },
];

// Corps SSE : une trame « event / data » par événement, séparées par une ligne vide.
function sse(events: { type: string }[]): string {
  return events.map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join('');
}

// Intercepte toutes les requêtes /api : le parcours tourne sans backend ni LLM réels.
export async function mockApi(page: Page): Promise<void> {
  // Seules les requêtes dont le chemin commence par /api/ sont simulées (pas les modules src/api/…).
  await page.route(
    (url) => url.pathname.startsWith('/api/'),
    (route: Route) => {
      const { pathname } = new URL(route.request().url());
      const method = route.request().method();

      if (pathname === '/api/project/context' && method === 'GET') {
        return route.fulfill({ json: PROJECT_CONTEXT });
      }
      if (pathname === '/api/analyze' && method === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: sse(ANALYSIS_EVENTS),
        });
      }
      if (pathname === '/api/suggestions' && method === 'POST') {
        return route.fulfill({ json: SUGGESTIONS });
      }
      if (pathname === '/api/chat' && method === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: sse(CHAT_EVENTS),
        });
      }
      return route.fulfill({ status: 404, json: { message: 'Route introuvable' } });
    },
  );
}
