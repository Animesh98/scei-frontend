import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  
  // Session storage for generated content
  sessionData: Record<string, any>;
  setSessionData: (key: string, data: any) => void;
  getSessionData: (key: string) => any;
  clearSessionData: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  sessionData: {},
  setSessionData: (key, data) => 
    set((state) => ({
      sessionData: { ...state.sessionData, [key]: data }
    })),
  getSessionData: (key) => get().sessionData[key],
  clearSessionData: () => set({ sessionData: {} }),
}));