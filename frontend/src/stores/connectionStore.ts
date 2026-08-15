import { create } from 'zustand';
import { API_BASE } from '../lib/config';

interface ConnectionState {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  modelId: string;
  isConnected: boolean;
  isValidating: boolean;
  error: string | null;
  setField: (field: 'region' | 'accessKeyId' | 'secretAccessKey' | 'sessionToken' | 'modelId', value: string) => void;
  validate: () => Promise<boolean>;
  disconnect: () => void;
}

const STORAGE_KEY = 'recallai_connection';

function loadFromSession(): Partial<ConnectionState> {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        region: parsed.region || 'us-east-1',
        accessKeyId: parsed.accessKeyId || '',
        secretAccessKey: parsed.secretAccessKey || '',
        sessionToken: parsed.sessionToken || '',
        modelId: parsed.modelId || '',
        isConnected: parsed.isConnected || false,
      };
    }
  } catch {}
  return {};
}

function saveToSession(state: ConnectionState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      region: state.region,
      accessKeyId: state.accessKeyId,
      secretAccessKey: state.secretAccessKey,
      sessionToken: state.sessionToken,
      modelId: state.modelId,
      isConnected: state.isConnected,
    }));
  } catch {}
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  region: 'us-east-1',
  accessKeyId: '',
  secretAccessKey: '',
  sessionToken: '',
  modelId: '',
  isConnected: false,
  isValidating: false,
  error: null,
  ...loadFromSession(),

  setField: (field, value) => {
    set({ [field]: value, error: null });
  },

  validate: async () => {
    const { region, accessKeyId, secretAccessKey, sessionToken, modelId } = get();

    if (!accessKeyId || !secretAccessKey || !modelId) {
      set({ error: 'Please fill in all fields.' });
      return false;
    }

    set({ isValidating: true, error: null });

    try {
      const response = await fetch(`${API_BASE}/api/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentials: { region, accessKeyId, secretAccessKey, ...(sessionToken && { sessionToken }) },
          modelId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        set({ isConnected: true, isValidating: false });
        saveToSession(get());
        return true;
      } else {
        set({ error: data.error || 'Validation failed.', isValidating: false });
        return false;
      }
    } catch (err) {
      set({ error: 'Unable to connect to the API. Please try again.', isValidating: false });
      return false;
    }
  },

  disconnect: () => {
    set({
      isConnected: false,
      accessKeyId: '',
      secretAccessKey: '',
      sessionToken: '',
      error: null,
    });
    sessionStorage.removeItem(STORAGE_KEY);
  },
}));
