import type { TicketPatch } from '@ticket-studio/shared';
import { useAtelierStore } from '@/features/atelier/atelier-store';
import { useTicketStore } from '@/features/saisie/ticket-store';

// Applique une modification proposée par l'agent : le ticket pour les scénarios et sections,
// l'atelier pour les précisions et questions ouvertes. Le diagnostic se recalcule ensuite seul.
export function applyTicketPatch(patch: TicketPatch): void {
  const { ticket, setTicket } = useTicketStore.getState();

  switch (patch.type) {
    case 'add-scenario':
      setTicket({ ...ticket, scenarios: [...ticket.scenarios, patch.scenario] });
      return;
    case 'rewrite-section':
      setTicket(
        patch.sectionKey === 'context'
          ? { ...ticket, context: patch.text }
          : { ...ticket, description: patch.text },
      );
      return;
    case 'add-precision':
      useAtelierStore.getState().addPrecision(patch.label, patch.text);
      return;
    case 'add-open-question':
      useAtelierStore.getState().addQuestion(patch.question);
      return;
  }
}

// Titre et détail affichés sur la carte de modification.
export function describePatch(patch: TicketPatch): { title: string; detail: string } {
  switch (patch.type) {
    case 'add-scenario':
      return {
        title: 'Ajouter un scénario',
        detail: `Given ${patch.scenario.given} / When ${patch.scenario.when} / Then ${patch.scenario.then}`,
      };
    case 'add-precision':
      return { title: `Ajouter la précision « ${patch.label} »`, detail: patch.text };
    case 'add-open-question':
      return { title: 'Ajouter une question ouverte', detail: patch.question };
    case 'rewrite-section':
      return {
        title: patch.sectionKey === 'context' ? 'Réécrire le contexte' : 'Réécrire la description',
        detail: patch.text,
      };
  }
}
