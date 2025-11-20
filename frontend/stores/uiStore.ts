import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'auto';
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  modals: Record<string, boolean>;
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  theme: 'light',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  },
  modals: {},
  openModal: (id) => set((state) => ({ modals: { ...state.modals, [id]: true } })),
  closeModal: (id) => set((state) => ({ modals: { ...state.modals, [id]: false } })),
}));

