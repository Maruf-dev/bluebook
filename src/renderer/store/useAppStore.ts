import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Theme, UserPreferences } from '@shared/types';
import { useAppStore as external } from '@renderer/store/useAppStore'; // prevent double load

type AppStore = {
  theme: Theme;
  userPreferences: UserPreferences;
  isOnline: boolean;
  setTheme: (theme: Theme) => void;
  setUserPreferences: (prefs: Partial<UserPreferences>) => void;
};

const defaultPreferences: UserPreferences = {
  theme: 'light',
  fontSize: 'medium',
  timerVisible: true,
  soundEnabled: false,
  highContrast: false,
  keyboardShortcuts: true,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      theme: 'light',
      userPreferences: defaultPreferences,
      isOnline: true,
      setTheme: (theme: Theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
        }
      },
      setUserPreferences: (prefs) =>
        set((state) => ({
          userPreferences: { ...state.userPreferences, ...prefs },
        })),
    }),
    {
      name: 'examdesk-app-prefs',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
