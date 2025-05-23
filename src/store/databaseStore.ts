import { create } from 'zustand';
import { DatabaseService } from '../lib/database/DatabaseService';

interface DatabaseState {
  initialized: boolean;
  loading: boolean;
  error: string | null;
  initialize: (dbService: DatabaseService) => Promise<void>;
  backup: () => Promise<Uint8Array>;
  restore: (data: Uint8Array) => Promise<void>;
  reset: () => Promise<void>;
}

export const useDatabaseStore = create<DatabaseState>((set, get) => ({
  initialized: false,
  loading: false,
  error: null,

  initialize: async (dbService: DatabaseService) => {
    set({ loading: true, error: null });
    try {
      await dbService.initialize();
      set({ initialized: true, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to initialize database',
        loading: false 
      });
    }
  },

  backup: async () => {
    set({ loading: true, error: null });
    try {
      const db = DatabaseService.getInstance();
      const data = await db.backup();
      set({ loading: false });
      return data;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to backup database',
        loading: false 
      });
      throw error;
    }
  },

  restore: async (data: Uint8Array) => {
    set({ loading: true, error: null });
    try {
      const db = DatabaseService.getInstance();
      await db.restore(data);
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to restore database',
        loading: false 
      });
      throw error;
    }
  },

  reset: async () => {
    set({ loading: true, error: null });
    try {
      const db = DatabaseService.getInstance();
      db.close();
      set({ initialized: false, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to reset database',
        loading: false 
      });
      throw error;
    }
  }
})); 
