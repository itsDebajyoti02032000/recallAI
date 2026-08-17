import { create } from 'zustand';
import type { Memory, MemoryType } from '@recallai/shared';
import { API_BASE } from '../lib/config';
import { useConnectionStore } from './connectionStore';

interface MemoryState {
  memories: Memory[];
  isLoading: boolean;
  isPanelOpen: boolean;
  filter: MemoryType | 'all';
  searchQuery: string;
  stats: { total: number; facts: number; preferences: number; episodic: number } | null;
  activeMemoryIds: string[];

  togglePanel: () => void;
  setFilter: (filter: MemoryType | 'all') => void;
  setSearchQuery: (query: string) => void;
  fetchMemories: () => Promise<void>;
  fetchStats: () => Promise<void>;
  updateMemory: (id: string, updates: { content?: string; importance?: number; type?: MemoryType }) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  setActiveMemoryIds: (ids: string[]) => void;
}

function getCredentials() {
  const { region, accessKeyId, secretAccessKey, sessionToken } = useConnectionStore.getState();
  return { region, accessKeyId, secretAccessKey, ...(sessionToken && { sessionToken }) };
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  memories: [],
  isLoading: false,
  isPanelOpen: false,
  filter: 'all',
  searchQuery: '',
  stats: null,
  activeMemoryIds: [],

  togglePanel: () => {
    const willOpen = !get().isPanelOpen;
    set({ isPanelOpen: willOpen });
    if (willOpen) {
      get().fetchMemories();
      get().fetchStats();
    }
  },

  setFilter: (filter) => {
    set({ filter });
    get().fetchMemories();
  },

  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
  },

  fetchMemories: async () => {
    set({ isLoading: true });
    try {
      const credentials = getCredentials();
      const { filter } = get();

      const response = await fetch(`${API_BASE}/api/memories/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentials,
          type: filter === 'all' ? undefined : filter,
          limit: 100,
        }),
      });

      const data = await response.json();
      if (data.success) {
        set({ memories: data.memories });
      }
    } catch {
      // Silent fail for memory fetch
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const credentials = getCredentials();

      const response = await fetch(`${API_BASE}/api/memories/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials }),
      });

      const data = await response.json();
      if (data.success) {
        set({ stats: { total: data.total, facts: data.facts, preferences: data.preferences, episodic: data.episodic } });
      }
    } catch {
      // Silent fail
    }
  },

  updateMemory: async (id, updates) => {
    try {
      const credentials = getCredentials();

      const response = await fetch(`${API_BASE}/api/memories/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials, memoryId: id, ...updates }),
      });

      const data = await response.json();
      if (data.success) {
        set((state) => ({
          memories: state.memories.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }));
        get().fetchStats();
      }
    } catch {
      // Silent fail
    }
  },

  deleteMemory: async (id) => {
    try {
      const credentials = getCredentials();

      const response = await fetch(`${API_BASE}/api/memories/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials, memoryId: id }),
      });

      const data = await response.json();
      if (data.success) {
        set((state) => ({
          memories: state.memories.filter((m) => m.id !== id),
        }));
        get().fetchStats();
      }
    } catch {
      // Silent fail
    }
  },

  setActiveMemoryIds: (ids) => {
    set({ activeMemoryIds: ids });
  },
}));
