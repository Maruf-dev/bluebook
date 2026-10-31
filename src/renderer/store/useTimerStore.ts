import { create } from 'zustand';

type TimerStore = {
  isVisible: boolean;
  setVisible: (visible: boolean) => void;
  toggleVisibility: () => void;
};

/** Only UI state lives here — the countdown itself is derived from the module's deadline. */
export const useTimerStore = create<TimerStore>((set) => ({
  isVisible: true,
  setVisible: (isVisible) => set({ isVisible }),
  toggleVisibility: () => set((s) => ({ isVisible: !s.isVisible })),
}));
