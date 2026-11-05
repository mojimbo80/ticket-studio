import { create } from 'zustand';

// Décision prise sur une suggestion : une réponse du PM, ou une suggestion ignorée.
export type SuggestionResolution = { status: 'answered'; answer: string } | { status: 'ignored' };

interface AtelierState {
  resolutions: Record<string, SuggestionResolution>;
  answer: (suggestionId: string, answer: string) => void;
  ignore: (suggestionId: string) => void;
  reopen: (suggestionId: string) => void;
}

// Réponses de l'atelier, gardées pendant la session (sans persistance serveur).
export const useAtelierStore = create<AtelierState>()((set) => ({
  resolutions: {},
  answer: (suggestionId, answer) =>
    set((state) => ({
      resolutions: { ...state.resolutions, [suggestionId]: { status: 'answered', answer } },
    })),
  ignore: (suggestionId) =>
    set((state) => ({
      resolutions: { ...state.resolutions, [suggestionId]: { status: 'ignored' } },
    })),
  reopen: (suggestionId) =>
    set((state) => {
      const resolutions = { ...state.resolutions };
      delete resolutions[suggestionId];
      return { resolutions };
    }),
}));
