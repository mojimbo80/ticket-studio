import { describe, expect, it } from 'vitest';
import { extractEndpoints, extractRoutesFromSource, parseOpenApi } from './endpoints';
import type { RepoFile } from './file-tree';
import { createTempRepo, removeTempRepo } from './test-helpers';

// Résumé lisible et trié : "GET /users" ; l'ordre ne dépend pas de l'implémentation.
function summarize(endpoints: { method: string; path: string }[]): string[] {
  return endpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`).sort();
}

describe('parseOpenApi', () => {
  it("lit les méthodes de chaque chemin d'un fichier YAML", () => {
    const content = `
openapi: 3.0.0
paths:
  /users:
    get: {}
    post: {}
    parameters: []
  /users/{id}:
    delete: {}
    x-internal: true
`;

    const endpoints = parseOpenApi(content, 'openapi.yaml');

    expect(summarize(endpoints)).toEqual(['DELETE /users/{id}', 'GET /users', 'POST /users']);
    expect(endpoints.every((endpoint) => endpoint.source === 'openapi.yaml')).toBe(true);
  });

  it('lit un fichier JSON', () => {
    const content = JSON.stringify({ paths: { '/health': { get: {} } } });

    expect(summarize(parseOpenApi(content, 'swagger.json'))).toEqual(['GET /health']);
  });

  it('renvoie une liste vide pour un document sans section paths', () => {
    expect(parseOpenApi('openapi: 3.0.0\ninfo: {}', 'openapi.yaml')).toEqual([]);
  });

  it('renvoie une liste vide pour un contenu illisible', () => {
    expect(parseOpenApi('{ paths: [', 'openapi.yaml')).toEqual([]);
  });
});

describe('extractRoutesFromSource', () => {
  it('lit les routes Express', () => {
    const content = `
import express from 'express';
const app = express();
app.get('/api/tickets', listTickets);
router.post("/api/tickets/:id/close", closeTicket);
app.get('setting', readSetting);
`;

    const endpoints = extractRoutesFromSource('server/app.ts', content);

    expect(summarize(endpoints)).toEqual(['GET /api/tickets', 'POST /api/tickets/:id/close']);
    expect(endpoints[0]?.source).toBe('server/app.ts');
  });

  it("ignore les appels HTTP d'un client qui n'importe aucun framework serveur", () => {
    const content = "const api = createClient(); api.get('/api/tickets');";

    expect(extractRoutesFromSource('web/client.ts', content)).toEqual([]);
  });

  it('lit les contrôleurs NestJS avec leur préfixe', () => {
    const content = `
import { Controller, Get, Post } from '@nestjs/common';
@Controller('tickets')
export class TicketsController {
  @Get()
  list() {}
  @Post(':id/close')
  close() {}
}
`;

    expect(summarize(extractRoutesFromSource('src/tickets.controller.ts', content))).toEqual([
      'GET /tickets',
      'POST /tickets/:id/close',
    ]);
  });

  it('lit les routes FastAPI', () => {
    const content = `
from fastapi import FastAPI
app = FastAPI()

@app.get("/items/{item_id}")
def read_item(item_id: int):
    ...

@app.post('/items')
def create_item():
    ...
`;

    expect(summarize(extractRoutesFromSource('api/main.py', content))).toEqual([
      'GET /items/{item_id}',
      'POST /items',
    ]);
  });

  it('lit les routes Flask avec leurs méthodes', () => {
    const content = `
from flask import Flask
app = Flask(__name__)

@app.route('/login', methods=['GET', 'POST'])
def login():
    ...

@app.route('/about')
def about():
    ...
`;

    expect(summarize(extractRoutesFromSource('api/views.py', content))).toEqual([
      'GET /about',
      'GET /login',
      'POST /login',
    ]);
  });

  it('lit les routes Next.js à partir du dossier et des fonctions exportées', () => {
    const content = `
export async function GET() {}
export async function DELETE() {}
export const helper = () => 1;
`;

    expect(
      summarize(extractRoutesFromSource('apps/web/app/api/tickets/[id]/route.ts', content)),
    ).toEqual(['DELETE /api/tickets/:id', 'GET /api/tickets/:id']);
  });
});

describe('extractEndpoints', () => {
  it('préfère le fichier OpenAPI quand il existe', async () => {
    const root = await createTempRepo({
      'openapi.yaml': 'paths:\n  /tickets:\n    get: {}\n',
      'src/app.ts': "import express from 'express';\napp.get('/autre', handler);\n",
    });
    try {
      const files: RepoFile[] = [
        { path: 'openapi.yaml', size: 40 },
        { path: 'src/app.ts', size: 60 },
      ];

      const endpoints = await extractEndpoints(root, files);

      expect(summarize(endpoints)).toEqual(['GET /tickets']);
    } finally {
      await removeTempRepo(root);
    }
  });

  it("analyse les routes du code quand il n'y a pas de fichier OpenAPI, sans les tests ni les clients", async () => {
    const root = await createTempRepo({
      'src/app.ts': "import express from 'express';\napp.get('/api/tickets', handler);\n",
      'src/app.test.ts': "import express from 'express';\napp.get('/api/test-only', handler);\n",
      'web/client.ts': "api.get('/api/from-client');\n",
    });
    try {
      const files: RepoFile[] = [
        { path: 'src/app.ts', size: 80 },
        { path: 'src/app.test.ts', size: 80 },
        { path: 'web/client.ts', size: 30 },
      ];

      const endpoints = await extractEndpoints(root, files);

      expect(summarize(endpoints)).toEqual(['GET /api/tickets']);
      expect(endpoints[0]?.source).toBe('src/app.ts');
    } finally {
      await removeTempRepo(root);
    }
  });
});
