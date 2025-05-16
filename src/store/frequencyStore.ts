import { create } from 'zustand';
import { FrequencyService } from '../lib/services/frequencyService';
import { ExportService } from '../lib/services/exportService';
import { Frequency, FrequencyFilter } from '../types/database';

// Create singleton service instances
const frequencyService = new FrequencyService();
const exportService = new ExportService();

interface FrequencyState {
  frequencies: Frequency[];
  loading: boolean;
  error: string | null;
  filter: FrequencyFilter | null;
  selectedFrequency: Frequency | null;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
  };
  fetchFrequencies: (filter?: FrequencyFilter | null, page?: number, pageSize?: number) => Promise<void>;
  setFilter: (filter: FrequencyFilter | null) => void;
  setPage: (page: number) => void;
  selectFrequency: (frequency: Frequency | null) => void;
  addFrequency: (frequency: Omit<Frequency, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateFrequency: (id: number, frequency: Partial<Frequency>) => Promise<void>;
  deleteFrequency: (id: number) => Promise<void>;
  exportFrequencies: (format: 'chirp' | 'uniden' | 'sdrtrunk' | 'sdrplus' | 'opengd77') => Promise<any>;
  toggleFrequencyFlag: (id: number, flag: keyof Pick<Frequency, 'export_chirp' | 'export_uniden' | 'export_sdrtrunk' | 'export_sdrplus' | 'export_opengd77'>) => Promise<void>;
}

export const useFrequencyStore = create<FrequencyState>((set, get) => ({
  frequencies: [],
  loading: false,
  error: null,
  filter: null,
  selectedFrequency: null,
  pagination: {
    page: 1,
    pageSize: 50,
    totalItems: 0
  },

  fetchFrequencies: async (filter, page, pageSize) => {
    set({ loading: true, error: null });
    try {
      const currentFilter = filter ?? get().filter;
      const currentPage = page ?? get().pagination.page;
      const currentPageSize = pageSize ?? get().pagination.pageSize;
      
      const result = await frequencyService.getFrequencies(
        currentFilter || undefined, 
        currentPage, 
        currentPageSize
      );
      
      set({ 
        frequencies: result.data, 
        pagination: {
          ...get().pagination,
          page: currentPage,
          pageSize: currentPageSize,
          totalItems: result.total
        },
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch frequencies',
        loading: false 
      });
    }
  },

  setFilter: (filter: FrequencyFilter | null) => {
    // Reset to page 1 when filter changes
    set({ filter, pagination: { ...get().pagination, page: 1 } });
    get().fetchFrequencies(filter, 1);
  },

  setPage: (page: number) => {
    get().fetchFrequencies(null, page);
  },

  selectFrequency: (frequency: Frequency | null) => {
    set({ selectedFrequency: frequency });
  },

  addFrequency: async (frequency: Omit<Frequency, 'id' | 'created_at' | 'updated_at'>) => {
    set({ loading: true, error: null });
    try {
      const newFrequency = await frequencyService.addFrequency(frequency);
      
      // Add the new frequency to the state if it belongs on the current page
      // This avoids a full refetch
      set(state => {
        const updatedFrequencies = [...state.frequencies];
        // Only add to current page if it matches the filter criteria
        if (shouldIncludeFrequencyWithFilter(newFrequency, state.filter)) {
          updatedFrequencies.push(newFrequency);
          // Re-sort by frequency
          updatedFrequencies.sort((a, b) => a.frequency - b.frequency);
          // Trim to page size if needed
          if (updatedFrequencies.length > state.pagination.pageSize) {
            updatedFrequencies.pop();
          }
        }
        
        return { 
          frequencies: updatedFrequencies, 
          loading: false,
          pagination: {
            ...state.pagination,
            totalItems: state.pagination.totalItems + 1
          }
        };
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add frequency',
        loading: false 
      });
    }
  },

  updateFrequency: async (id: number, frequency: Partial<Frequency>) => {
    set({ loading: true, error: null });
    try {
      const updatedFrequency = await frequencyService.updateFrequency(id, frequency);
      
      // Update the frequency in the state without a full refetch
      if (updatedFrequency) {
        set(state => ({
          frequencies: state.frequencies.map(f => 
            f.id === id ? updatedFrequency : f
          ),
          loading: false
        }));
      } else {
        set({ loading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update frequency',
        loading: false 
      });
    }
  },

  deleteFrequency: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await frequencyService.deleteFrequency(id);
      
      // Remove the frequency from the state without a full refetch
      set(state => ({
        frequencies: state.frequencies.filter(f => f.id !== id),
        loading: false,
        pagination: {
          ...state.pagination,
          totalItems: state.pagination.totalItems - 1
        }
      }));
      
      // If this was the last item on a page and not the first page,
      // fetch the previous page
      const { page, pageSize, totalItems } = get().pagination;
      if (page > 1 && get().frequencies.length === 0) {
        get().fetchFrequencies(null, page - 1);
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete frequency',
        loading: false 
      });
    }
  },

  exportFrequencies: async (format: 'chirp' | 'uniden' | 'sdrtrunk' | 'sdrplus' | 'opengd77') => {
    set({ loading: true, error: null });
    try {
      // Get all frequencies that match the filter, not just the current page
      const frequencies = await frequencyService.getAllFrequencies(get().filter || undefined);
      
      let result;
      switch (format) {
        case 'chirp':
          result = await exportService.exportToChirp(frequencies);
          break;
        case 'uniden':
          result = await exportService.exportToUniden(frequencies);
          break;
        case 'sdrtrunk':
          result = await exportService.exportToSDRTrunk(frequencies);
          break;
        case 'sdrplus':
          result = await exportService.exportToSDRTrunk(frequencies);
          break;
        case 'opengd77':
          result = await exportService.exportToOpenGD77(frequencies);
          break;
      }
      
      set({ loading: false });
      return result;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to export frequencies',
        loading: false 
      });
      throw error;
    }
  },

  toggleFrequencyFlag: async (id: number, flag: keyof Pick<Frequency, 'export_chirp' | 'export_uniden' | 'export_sdrtrunk' | 'export_sdrplus' | 'export_opengd77'>) => {
    set({ loading: true, error: null });
    try {
      await frequencyService.toggleExportFlag(id, flag);
      
      // Update the flag in the state without a full refetch
      set(state => ({
        frequencies: state.frequencies.map(f => {
          if (f.id === id) {
            return {
              ...f,
              [flag]: f[flag] === 1 ? 0 : 1,
              updated_at: new Date().toISOString()
            };
          }
          return f;
        }),
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to toggle frequency flag',
        loading: false 
      });
    }
  }
}));

// Helper function to check if a frequency matches the given filter
function shouldIncludeFrequencyWithFilter(frequency: Frequency, filter: FrequencyFilter | null): boolean {
  if (!filter) return true;
  
  if (filter.mode && filter.mode.length > 0 && !filter.mode.includes(frequency.mode)) {
    return false;
  }
  
  if (filter.serviceType && filter.serviceType.length > 0 && 
      (!frequency.service_type || !filter.serviceType.includes(frequency.service_type))) {
    return false;
  }
  
  if (filter.county && filter.county.length > 0 && 
      (!frequency.county || !filter.county.includes(frequency.county))) {
    return false;
  }
  
  if (filter.state && filter.state.length > 0 && 
      (!frequency.state || !filter.state.includes(frequency.state))) {
    return false;
  }
  
  if (filter.active !== undefined && frequency.active !== (filter.active ? 1 : 0)) {
    return false;
  }
  
  if (filter.tagContains && (!frequency.tags || !frequency.tags.includes(filter.tagContains))) {
    return false;
  }
  
  if (filter.frequencyRange && (
      frequency.frequency < filter.frequencyRange[0] || 
      frequency.frequency > filter.frequencyRange[1])) {
    return false;
  }
  
  return true;
} 
