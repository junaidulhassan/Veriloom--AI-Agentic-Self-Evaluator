import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'coral' | 'charcoal'

interface SettingsState {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'coral',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'coral' ? 'charcoal' : 'coral' }),
    }),
    {
      name: 'veriloom.settings',
      version: 1,
      partialize: (state) => ({ theme: state.theme }),
      migrate: (persisted) => ({ theme: (persisted as { theme?: ThemeMode } | null)?.theme ?? 'coral' }),
    },
  ),
)
