import { create } from 'zustand'
import { Database } from 'sql.js'
import { 
  Frequency, 
  TrunkedSystem, 
  TrunkedSite, 
  Talkgroup,
  Radio,
  ExportProfile,
  County,
  FrequencyFilter,
  TrunkedSystemFilter,
  TalkgroupFilter
} from '../types/models'

// Database Store
interface DatabaseState {
  db: Database | null
  setDb: (db: Database) => void
  isLoading: boolean
  setLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
}

export const useDatabaseStore = create<DatabaseState>((set) => ({
  db: null,
  setDb: (db) => set({ db }),
  isLoading: true,
  setLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error })
}))

// Frequencies Store
interface FrequenciesState {
  frequencies: Frequency[]
  setFrequencies: (frequencies: Frequency[]) => void
  filter: FrequencyFilter
  setFilter: (filter: Partial<FrequencyFilter>) => void
  selectedFrequency: Frequency | null
  setSelectedFrequency: (frequency: Frequency | null) => void
}

export const useFrequenciesStore = create<FrequenciesState>((set) => ({
  frequencies: [],
  setFrequencies: (frequencies) => set({ frequencies }),
  filter: {},
  setFilter: (filter) => set((state) => ({ filter: { ...state.filter, ...filter } })),
  selectedFrequency: null,
  setSelectedFrequency: (frequency) => set({ selectedFrequency: frequency })
}))

// Trunked Systems Store
interface TrunkedSystemsState {
  systems: TrunkedSystem[]
  setSystems: (systems: TrunkedSystem[]) => void
  sites: TrunkedSite[]
  setSites: (sites: TrunkedSite[]) => void
  talkgroups: Talkgroup[]
  setTalkgroups: (talkgroups: Talkgroup[]) => void
  systemFilter: TrunkedSystemFilter
  setSystemFilter: (filter: Partial<TrunkedSystemFilter>) => void
  talkgroupFilter: TalkgroupFilter
  setTalkgroupFilter: (filter: Partial<TalkgroupFilter>) => void
  selectedSystem: TrunkedSystem | null
  setSelectedSystem: (system: TrunkedSystem | null) => void
  selectedSite: TrunkedSite | null
  setSelectedSite: (site: TrunkedSite | null) => void
}

export const useTrunkedSystemsStore = create<TrunkedSystemsState>((set) => ({
  systems: [],
  setSystems: (systems) => set({ systems }),
  sites: [],
  setSites: (sites) => set({ sites }),
  talkgroups: [],
  setTalkgroups: (talkgroups) => set({ talkgroups }),
  systemFilter: {},
  setSystemFilter: (filter) => set((state) => ({ systemFilter: { ...state.systemFilter, ...filter } })),
  talkgroupFilter: {},
  setTalkgroupFilter: (filter) => set((state) => ({ talkgroupFilter: { ...state.talkgroupFilter, ...filter } })),
  selectedSystem: null,
  setSelectedSystem: (system) => set({ selectedSystem: system }),
  selectedSite: null,
  setSelectedSite: (site) => set({ selectedSite: site })
}))

// UI Store
interface UIState {
  darkMode: boolean
  setDarkMode: (darkMode: boolean) => void
  toggleDarkMode: () => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  activeTab: 'frequencies' | 'trunked' | 'export' | 'settings'
  setActiveTab: (tab: 'frequencies' | 'trunked' | 'export' | 'settings') => void
  modals: {
    frequency: boolean
    trunkedSystem: boolean
    export: boolean
    settings: boolean
  }
  setModal: (modal: keyof UIState['modals'], open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  darkMode: false,
  setDarkMode: (darkMode) => set({ darkMode }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  activeTab: 'frequencies',
  setActiveTab: (tab) => set({ activeTab: tab }),
  modals: {
    frequency: false,
    trunkedSystem: false,
    export: false,
    settings: false
  },
  setModal: (modal, open) => set((state) => ({
    modals: { ...state.modals, [modal]: open }
  }))
}))

// Export Store
interface ExportState {
  radios: Radio[]
  setRadios: (radios: Radio[]) => void
  profiles: ExportProfile[]
  setProfiles: (profiles: ExportProfile[]) => void
  selectedRadio: Radio | null
  setSelectedRadio: (radio: Radio | null) => void
  selectedProfile: ExportProfile | null
  setSelectedProfile: (profile: ExportProfile | null) => void
}

export const useExportStore = create<ExportState>((set) => ({
  radios: [],
  setRadios: (radios) => set({ radios }),
  profiles: [],
  setProfiles: (profiles) => set({ profiles }),
  selectedRadio: null,
  setSelectedRadio: (radio) => set({ selectedRadio: radio }),
  selectedProfile: null,
  setSelectedProfile: (profile) => set({ selectedProfile: profile })
}))

// Counties Store
interface CountiesState {
  counties: County[]
  setCounties: (counties: County[]) => void
  selectedCounty: County | null
  setSelectedCounty: (county: County | null) => void
}

export const useCountiesStore = create<CountiesState>((set) => ({
  counties: [],
  setCounties: (counties) => set({ counties }),
  selectedCounty: null,
  setSelectedCounty: (county) => set({ selectedCounty: county })
})) 
