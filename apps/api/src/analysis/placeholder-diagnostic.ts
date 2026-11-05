import {
  type Diagnostic,
  DiagnosticSchema,
  getTicketSections,
  type Ticket,
} from '@ticket-studio/shared';

// Données fictives typées : le vrai diagnostic (étapes 8 et 9) remplacera cette fonction.
export function buildPlaceholderDiagnostic(ticket: Ticket): Diagnostic {
  return DiagnosticSchema.parse({
    status: 'presque-pret',
    blockers: 1,
    recommendations: 2,
    sections: getTicketSections(ticket),
    suggestions: [
      {
        id: 'placeholder-bloquant',
        severity: 'bloquant',
        text: 'Exemple de suggestion bloquante (données fictives)',
        source: 'placeholder',
      },
      {
        id: 'placeholder-recommandation',
        severity: 'recommandation',
        text: 'Exemple de suggestion (données fictives)',
        source: 'placeholder',
      },
    ],
  });
}
