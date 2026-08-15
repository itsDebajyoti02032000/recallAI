import { create } from 'zustand';
import { useConnectionStore } from './connectionStore';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isGenerating: boolean;
  abortController: AbortController | null;
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string) => void;
  sendMessage: (content: string) => Promise<void>;
  stopGeneration: () => void;
  regenerateLastResponse: () => Promise<void>;
  clearConversations: () => void;
}

function generateId(): string {
  return crypto.randomUUID();
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  isGenerating: false,
  abortController: null,

  createConversation: () => {
    const id = generateId();
    const conversation: Conversation = {
      id,
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
    };
    set((state) => ({
      conversations: [conversation, ...state.conversations],
      activeConversationId: id,
    }));
    return id;
  },

  deleteConversation: (id) => {
    set((state) => {
      const conversations = state.conversations.filter((c) => c.id !== id);
      const activeConversationId =
        state.activeConversationId === id
          ? conversations[0]?.id ?? null
          : state.activeConversationId;
      return { conversations, activeConversationId };
    });
  },

  setActiveConversation: (id) => {
    set({ activeConversationId: id });
  },

  sendMessage: async (content) => {
    const state = get();
    let conversationId = state.activeConversationId;

    if (!conversationId) {
      conversationId = get().createConversation();
    }

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    set((state) => ({
      conversations: state.conversations.map((c) => {
        if (c.id !== conversationId) return c;
        const updatedMessages = [...c.messages, userMessage, assistantMessage];
        const title = c.messages.length === 0 ? content.slice(0, 40) : c.title;
        return { ...c, messages: updatedMessages, title };
      }),
      isGenerating: true,
    }));

    const abortController = new AbortController();
    set({ abortController });

    try {
      const { region, accessKeyId, secretAccessKey, sessionToken, modelId } = useConnectionStore.getState();
      const conversation = get().conversations.find((c) => c.id === conversationId);
      const messages = conversation?.messages
        .filter((m) => !m.isStreaming)
        .map((m) => ({ id: m.id, role: m.role, content: m.content })) ?? [];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          credentials: { region, accessKeyId, secretAccessKey, ...(sessionToken && { sessionToken }) },
          modelId,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = JSON.parse(line.slice(6));

          if (data.type === 'delta' && data.text) {
            set((state) => ({
              conversations: state.conversations.map((c) => {
                if (c.id !== conversationId) return c;
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: m.content + data.text }
                      : m
                  ),
                };
              }),
            }));
          }

          if (data.type === 'error') {
            set((state) => ({
              conversations: state.conversations.map((c) => {
                if (c.id !== conversationId) return c;
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: `Error: ${data.message}`, isStreaming: false }
                      : m
                  ),
                };
              }),
            }));
          }

          if (data.type === 'done') {
            set((state) => ({
              conversations: state.conversations.map((c) => {
                if (c.id !== conversationId) return c;
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMessage.id ? { ...m, isStreaming: false } : m
                  ),
                };
              }),
            }));
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMessage.id
                  ? { ...m, content: 'Failed to get response. Please try again.', isStreaming: false }
                  : m
              ),
            };
          }),
        }));
      }
    } finally {
      set({ isGenerating: false, abortController: null });
    }
  },

  stopGeneration: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set((state) => ({
        isGenerating: false,
        abortController: null,
        conversations: state.conversations.map((c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.isStreaming ? { ...m, isStreaming: false } : m
          ),
        })),
      }));
    }
  },

  regenerateLastResponse: async () => {
    const state = get();
    const conversation = state.conversations.find(
      (c) => c.id === state.activeConversationId
    );
    if (!conversation || conversation.messages.length < 2) return;

    const lastAssistantIdx = conversation.messages.length - 1;
    const lastAssistant = conversation.messages[lastAssistantIdx];
    if (lastAssistant?.role !== 'assistant') return;

    set((state) => ({
      conversations: state.conversations.map((c) => {
        if (c.id !== state.activeConversationId) return c;
        return { ...c, messages: c.messages.slice(0, -1) };
      }),
    }));

    const lastUserMessage = conversation.messages[lastAssistantIdx - 1];
    if (lastUserMessage?.role === 'user') {
      set((state) => ({
        conversations: state.conversations.map((c) => {
          if (c.id !== state.activeConversationId) return c;
          return { ...c, messages: c.messages.slice(0, -1) };
        }),
      }));
      await get().sendMessage(lastUserMessage.content);
    }
  },

  clearConversations: () => {
    set({ conversations: [], activeConversationId: null });
  },
}));
