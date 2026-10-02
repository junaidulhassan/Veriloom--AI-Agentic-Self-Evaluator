import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  sidebarOpen: boolean
  inspectorOpen: boolean
  commandOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setInspectorOpen: (open: boolean) => void
  setCommandOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      inspectorOpen: false,
      commandOpen: false,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
      setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
    }),
    { name: 'veriloom.ui', partialize: (state) => ({ sidebarOpen: state.sidebarOpen }) },
  ),
)
