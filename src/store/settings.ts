import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'coral' | 'charcoal'

interface SettingsState {
  theme: ThemeMode
  adminKey: string
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  setAdminKey: (key: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'coral',
      adminKey: '',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'coral' ? 'charcoal' : 'coral' }),
      setAdminKey: (adminKey) => set({ adminKey: adminKey.trim() }),
    }),
    { name: 'veriloom.settings' },
  ),
)
