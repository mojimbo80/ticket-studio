import { create } from 'zustand';

// Décision prise sur une suggestion : une réponse du PM, ou une suggestion ignorée.
export type SuggestionResolution = { status: 'answered'; answer: string } | { status: 'ignored' };

// Précision ou question ouverte ajoutée hors suggestion, par la conversation.
export interface ManualPrecision {
  id: string;
  label: string;
  text: string;
}

export interface ManualQuestion {
  id: string;
  question: string;
}

export interface AtelierAnswers {
  resolutions: Record<string, SuggestionResolution>;
  manualPrecisions: ManualPrecision[];
  manualQuestions: ManualQuestion[];
}

interface AtelierState extends AtelierAnswers {
  answer: (suggestionId: string, answer: string) => void;
  ignore: (suggestionId: string) => void;
  reopen: (suggestionId: string) => void;
  addPrecision: (label: string, text: string) => void;
  addQuestion: (question: string) => void;
}

// Réponses de l'atelier, gardées pendant la session (sans persistance serveur).
export const useAtelierStore = create<AtelierState>()((set) => ({
  resolutions: {},
  manualPrecisions: [],
  manualQuestions: [],
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
  addPrecision: (label, text) =>
    set((state) => ({
      manualPrecisions: [...state.manualPrecisions, { id: crypto.randomUUID(), label, text }],
    })),
  addQuestion: (question) =>
    set((state) => ({
      manualQuestions: [...state.manualQuestions, { id: crypto.randomUUID(), question }],
    })),
}));
