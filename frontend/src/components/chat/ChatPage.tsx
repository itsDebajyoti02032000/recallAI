import { useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useConnectionStore } from '../../stores/connectionStore';
import { useMemoryStore } from '../../stores/memoryStore';
import { useAgentStore } from '../../stores/agentStore';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { MemoryPanel } from '../memory/MemoryPanel';
import { AgentActivitySidePanel } from '../agent/AgentActivitySidePanel';

export function ChatPage() {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const conversations = useChatStore((s) => s.conversations);
  const createConversation = useChatStore((s) => s.createConversation);
  const modelId = useConnectionStore((s) => s.modelId);
  const { isPanelOpen, togglePanel, closePanel: closeMemoryPanel, stats } = useMemoryStore();
  const { showActivityPanel, toggleActivityPanel, closeActivityPanel, isUsingTools } = useAgentStore();

  const conversation = conversations.find((c) => c.id === activeConversationId);

  useEffect(() => {
    if (!activeConversationId && conversations.length === 0) {
      createConversation();
    }
  }, [activeConversationId, conversations.length, createConversation]);

  return (
    <div className="flex-1 flex h-screen">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/50">
          <h2 className="text-sm font-medium text-slate-300 truncate">
            {conversation?.title || 'New Conversation'}
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="px-2 py-1 bg-slate-700 rounded-md">
              {modelId.split('.').pop()?.split('-v')[0] || modelId}
            </span>
            <button
              onClick={() => {
                if (!showActivityPanel) closeMemoryPanel();
                toggleActivityPanel();
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                showActivityPanel
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Agent Activity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {isUsingTools && (
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              )}
            </button>
            <button
              onClick={() => {
                if (!isPanelOpen) closeActivityPanel();
                togglePanel();
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                isPanelOpen
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Memory Inspector"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {stats && stats.total > 0 && (
                <span className="text-[10px]">{stats.total}</span>
              )}
            </button>
          </div>
        </header>

        <MessageList messages={conversation?.messages || []} />
        <ChatInput />
      </div>

      {isPanelOpen && <MemoryPanel />}
      {showActivityPanel && <AgentActivitySidePanel onClose={closeActivityPanel} />}
    </div>
  );
}
