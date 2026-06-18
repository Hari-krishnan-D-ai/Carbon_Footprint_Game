import { create } from 'zustand';
import { parseUserAction } from '../services/geminiClient';
import { applyImpactToHealth, applyImpactToPollution } from '../utils/gameLogic';

const makeAlertId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Derive Sarah's mood from the latest impact event.
 */
const deriveSarahMood = (impactScore) => {
  if (impactScore >= 10) return 'celebrating';
  if (impactScore > 0) return 'happy';
  if (impactScore < -10) return 'worried';
  if (impactScore < 0) return 'worried';
  return 'neutral';
};

export const useGameStore = create((set, get) => ({
  // -- core state vectors --
  townHallHealth: 75,
  pollutionFactor: 25,
  npcAlertQueue: [],
  plantedTreesCount: 0,
  isEvilFlashing: false,

  // -- Sarah NPC state --
  sarahMood: 'happy',       // 'happy' | 'neutral' | 'worried' | 'celebrating'

  // -- turn history (last 5 for HUD display) --
  turnHistory: [],

  // -- onboarding (Sarah renders once at startup with welcome text) --
  hasOnboarded: false,
  completeOnboarding: () => set({ hasOnboarded: true }),

  // -- request lifecycle --
  isProcessing: false,
  lastImpact: null,
  lastError: null,

  /**
   * The single entry point used by the Floating NLP Parser. Sends the raw
   * action string through the proxy, then folds the structured response
   * into every dependent state vector in one update.
   */
  submitUserAction: async (userText) => {
    const trimmed = (userText ?? '').trim();
    if (!trimmed || get().isProcessing) return;

    set({ isProcessing: true, lastError: null });

    const { impactScore, category, remedy } = await parseUserAction(trimmed);

    if (impactScore < 0) {
      // 1. Trigger the evil background flash
      set({ isEvilFlashing: true });
      // 2. Pause for 1 second before applying penalties
      await new Promise((resolve) => setTimeout(resolve, 1000));
      set({ isEvilFlashing: false });
    }

    set((state) => {
      const nextHealth = applyImpactToHealth(state.townHallHealth, impactScore);
      let nextPollution = applyImpactToPollution(state.pollutionFactor, impactScore);
      let nextTreesCount = state.plantedTreesCount;

      // Special override: If the user says they planted a tree, reduce pollution dramatically (clearing the fog)
      const lowerText = trimmed.toLowerCase();
      if (lowerText.includes('plant') && lowerText.includes('tree')) {
        nextPollution = Math.max(0, nextPollution - 30);
        nextTreesCount = nextTreesCount + 1;
      }

      // The Barbarian Guard only instantiates on negative-impact events.
      const nextQueue =
        impactScore < 0
          ? [
              ...state.npcAlertQueue,
              {
                id: makeAlertId(),
                npc: 'barbarian',
                category,
                impactScore,
                headline: 'Save the future!',
                remedy,
              },
            ]
          : state.npcAlertQueue;

      // Push to turn history (keep last 5)
      const turnEntry = {
        id: makeAlertId(),
        text: trimmed.slice(0, 60),
        impactScore,
        category,
        timestamp: Date.now(),
      };
      const nextHistory = [turnEntry, ...state.turnHistory].slice(0, 5);

      return {
        townHallHealth: nextHealth,
        pollutionFactor: nextPollution,
        plantedTreesCount: nextTreesCount,
        lastImpact: { impactScore, category, remedy },
        npcAlertQueue: nextQueue,
        turnHistory: nextHistory,
        sarahMood: deriveSarahMood(impactScore),
        isProcessing: false,
      };
    });
  },

  dismissAlert: (id) =>
    set((state) => ({
      npcAlertQueue: state.npcAlertQueue.filter((alert) => alert.id !== id),
    })),
}));
