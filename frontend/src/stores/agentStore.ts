import { create } from 'zustand';
import type { ToolCall } from '../../../shared/types';

interface AgentState {
  activeToolCalls: ToolCall[];
  isUsingTools: boolean;
  showActivityPanel: boolean;

  addToolCall: (toolUseId: string, toolName: string, input?: Record<string, unknown>) => void;
  completeToolCall: (toolUseId: string, result: unknown, success: boolean) => void;
  clearToolCalls: () => void;
  toggleActivityPanel: () => void;
  closeActivityPanel: () => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  activeToolCalls: [],
  isUsingTools: false,
  showActivityPanel: true,

  addToolCall: (toolUseId, toolName, input) => {
    const call: ToolCall = {
      toolUseId,
      toolName,
      status: 'running',
      input,
      startedAt: Date.now(),
    };
    set((state) => ({
      activeToolCalls: [...state.activeToolCalls, call],
      isUsingTools: true,
    }));
  },

  completeToolCall: (toolUseId, result, success) => {
    set((state) => {
      const updated = state.activeToolCalls.map((tc) =>
        tc.toolUseId === toolUseId
          ? { ...tc, status: (success ? 'completed' : 'error') as ToolCall['status'], result, completedAt: Date.now() }
          : tc
      );
      return {
        activeToolCalls: updated,
        isUsingTools: updated.some((tc) => tc.status === 'running'),
      };
    });
  },

  clearToolCalls: () => set({ activeToolCalls: [], isUsingTools: false }),

  toggleActivityPanel: () => set((s) => ({ showActivityPanel: !s.showActivityPanel })),

  closeActivityPanel: () => set({ showActivityPanel: false }),
}));
