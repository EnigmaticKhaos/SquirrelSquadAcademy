import { create } from 'zustand';

interface LearningStore {
  xp: number;
  level: number;
  setXP: (xp: number) => void;
  setLevel: (level: number) => void;
  addXP: (amount: number) => void;
  achievements: string[];
  addAchievement: (achievementId: string) => void;
}

export const useLearningStore = create<LearningStore>((set) => ({
  xp: 0,
  level: 1,
  setXP: (xp) => set({ xp }),
  setLevel: (level) => set({ level }),
  addXP: (amount) =>
    set((state) => {
      const newXP = state.xp + amount;
      // Simple level calculation: level = floor(sqrt(xp / 100))
      const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;
      return { xp: newXP, level: newLevel };
    }),
  achievements: [],
  addAchievement: (achievementId) =>
    set((state) => ({
      achievements: [...state.achievements, achievementId],
    })),
}));

