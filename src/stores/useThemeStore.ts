import { create } from 'zustand';

type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeState {
  isDark: boolean;
  theme: ThemeMode;
  toggle: () => void;
  setTheme: (mode: ThemeMode) => void;
}

function getSystemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark);
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: getSystemDark(),
  theme: 'system',
  toggle: () =>
    set((state) => {
      const next = !state.isDark;
      applyTheme(next);
      return { isDark: next, theme: next ? 'dark' : 'light' };
    }),
  setTheme: (mode: ThemeMode) =>
    set(() => {
      const isDark = mode === 'system' ? getSystemDark() : mode === 'dark';
      applyTheme(isDark);
      return { isDark, theme: mode };
    }),
}));

// Initialize on load
applyTheme(getSystemDark());
