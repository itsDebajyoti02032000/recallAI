import { useChatStore } from '../../stores/chatStore';
import { ConversationItem } from './ConversationItem';

export function ConversationList() {
  const conversations = useChatStore((s) => s.conversations);

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <p className="text-xs text-slate-500 text-center">
          No conversations yet
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 space-y-1">
      {conversations.map((conversation) => (
        <ConversationItem key={conversation.id} conversation={conversation} />
      ))}
    </div>
  );
}
