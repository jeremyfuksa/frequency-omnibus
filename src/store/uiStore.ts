import { create } from 'zustand';
import { SettingsService } from '../lib/services/settingsService';

type TabType = 'frequencies' | 'trunked' | 'export' | 'settings' | 'dashboard';

interface UIState {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => Promise<void>;
  toggleSidebar: () => Promise<void>;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => Promise<void>;
  modals: {
    frequency: boolean;
    trunkedSystem: boolean;
    export: boolean;
    settings: boolean;
  };
  setModal: (modal: keyof UIState['modals'], open: boolean) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useUIStore = create<UIState>((set, get) => {
  const settingsService = new SettingsService();

  return {
    darkMode: false,
    setDarkMode: async (darkMode) => {
      await settingsService.setSetting('darkMode', darkMode, 'boolean');
      set({ darkMode });
    },
    toggleDarkMode: async () => {
      const newValue = !get().darkMode;
      await settingsService.setSetting('darkMode', newValue, 'boolean');
      set({ darkMode: newValue });
    },

    sidebarOpen: true,
    setSidebarOpen: async (open) => {
      await settingsService.setSetting('sidebarOpen', open, 'boolean');
      set({ sidebarOpen: open });
    },
    toggleSidebar: async () => {
      const newValue = !get().sidebarOpen;
      await settingsService.setSetting('sidebarOpen', newValue, 'boolean');
      set({ sidebarOpen: newValue });
    },

    activeTab: 'dashboard',
    setActiveTab: async (tab) => {
      await settingsService.setSetting('activeTab', tab, 'string');
      set({ activeTab: tab });
    },

    modals: {
      frequency: false,
      trunkedSystem: false,
      export: false,
      settings: false
    },
    setModal: async (modal, open) => {
      const newModals = { ...get().modals, [modal]: open };
      await settingsService.setSetting('modals', newModals, 'json');
      set({ modals: newModals });
    },

    initialize: async () => {
      const darkMode = await settingsService.getSetting('darkMode', false);
      const sidebarOpen = await settingsService.getSetting('sidebarOpen', true);
      const activeTab = await settingsService.getSetting<TabType>('activeTab', 'dashboard');
      const modals = await settingsService.getSetting('modals', {
        frequency: false,
        trunkedSystem: false,
        export: false,
        settings: false
      });

      set({
        darkMode,
        sidebarOpen,
        activeTab,
        modals
      });
    }
  };
}); 
