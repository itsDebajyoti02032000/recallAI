import { useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useConnectionStore } from '../../stores/connectionStore';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

export function ChatPage() {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const conversations = useChatStore((s) => s.conversations);
  const createConversation = useChatStore((s) => s.createConversation);
  const modelId = useConnectionStore((s) => s.modelId);

  const conversation = conversations.find((c) => c.id === activeConversationId);

  useEffect(() => {
    if (!activeConversationId && conversations.length === 0) {
      createConversation();
    }
  }, [activeConversationId, conversations.length, createConversation]);

  return (
    <div className="flex-1 flex flex-col h-screen">
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <h2 className="text-sm font-medium text-slate-300 truncate">
          {conversation?.title || 'New Conversation'}
        </h2>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="px-2 py-1 bg-slate-700 rounded-md">
            {modelId.split('.').pop()?.split('-v')[0] || modelId}
          </span>
        </div>
      </header>

      <MessageList messages={conversation?.messages || []} />
      <ChatInput />
    </div>
  );
}
