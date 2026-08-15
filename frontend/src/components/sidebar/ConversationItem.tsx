import { useChatStore } from '../../stores/chatStore';
import type { Conversation } from '../../stores/chatStore';

interface Props {
  conversation: Conversation;
}

export function ConversationItem({ conversation }: Props) {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);

  const isActive = conversation.id === activeConversationId;

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
      }`}
      onClick={() => setActiveConversation(conversation.id)}
    >
      <span className="flex-1 text-sm truncate">{conversation.title}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteConversation(conversation.id);
        }}
        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
