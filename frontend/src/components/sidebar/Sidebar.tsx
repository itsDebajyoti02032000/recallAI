import { useChatStore } from '../../stores/chatStore';
import { useConnectionStore } from '../../stores/connectionStore';
import { ConversationList } from './ConversationList';

export function Sidebar() {
  const createConversation = useChatStore((s) => s.createConversation);
  const disconnect = useConnectionStore((s) => s.disconnect);

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-700 flex flex-col h-screen shrink-0">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          RecallAI
        </h1>
      </div>

      <div className="p-3">
        <button
          onClick={() => createConversation()}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Conversation
        </button>
      </div>

      <ConversationList />

      <div className="mt-auto p-3 border-t border-slate-700">
        <button
          onClick={disconnect}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Disconnect
        </button>
      </div>
    </aside>
  );
}
