import { create } from 'zustand';
import type { TimerState } from '../types';

export const useTimerStore = create<TimerState>((set, get) => ({
  durationMinutes: 0,
  timeRemainingSeconds: 0,
  deadlineAt: null,
  startedAt: null,
  isRunning: false,
  isExpired: false,
  isVisible: true,
  warningSeconds: 300,

  startTimer: (durationMinutes: number, deadlineAt: number) => {
    const now = Date.now();
    set({
      durationMinutes,
      timeRemainingSeconds: Math.max(0, Math.floor((deadlineAt - now) / 1000)),
      deadlineAt,
      startedAt: now,
      isRunning: true,
      isExpired: false,
    });
  },

  stopTimer: () => set({ isRunning: false }),

  resetTimer: () =>
    set({
      durationMinutes: 0,
      timeRemainingSeconds: 0,
      deadlineAt: null,
      startedAt: null,
      isRunning: false,
      isExpired: false,
    }),

  toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),

  updateRemaining: (seconds: number) => {
    const now = Date.now();
    const { deadlineAt } = get();
    const remainingFromDeadline = deadlineAt
      ? Math.max(0, Math.floor((deadlineAt - now) / 1000))
      : 0;
    const isExpired = remainingFromDeadline <= 0;
    set({
      timeRemainingSeconds: seconds,
      isExpired,
      isRunning: !isExpired,
    });
  },
}));
