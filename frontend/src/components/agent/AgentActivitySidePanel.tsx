import { useChatStore } from '../../stores/chatStore';
import { useAgentStore } from '../../stores/agentStore';
import { ActivityStats } from './ActivityStats';
import { MessageToolGroup } from './MessageToolGroup';
import { ToolCallCard } from './ToolCallCard';
import type { ToolCall } from '../../../../shared/types';

interface Props {
  onClose: () => void;
}

export function AgentActivitySidePanel({ onClose }: Props) {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const conversations = useChatStore((s) => s.conversations);
  const activeToolCalls = useAgentStore((s) => s.activeToolCalls);
  const isUsingTools = useAgentStore((s) => s.isUsingTools);

  const conversation = conversations.find((c) => c.id === activeConversationId);

  const messagesWithTools = (conversation?.messages || [])
    .filter((m) => m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0)
    .reverse();

  const allToolCalls: ToolCall[] = messagesWithTools.flatMap((m) => m.toolCalls || []);

  return (
    <div className="w-80 h-full border-l border-slate-700 bg-slate-900 flex flex-col shrink-0">
      <div className="flex items-center justify-between px-3 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="text-sm font-medium text-slate-200">Agent Activity</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <ActivityStats toolCalls={allToolCalls} />

      {isUsingTools && activeToolCalls.length > 0 && (
        <div className="px-3 py-2 border-b border-slate-700 bg-amber-500/5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-[10px] text-amber-400 uppercase font-medium">Live</span>
          </div>
          <div className="space-y-1">
            {activeToolCalls.map((tc) => (
              <ToolCallCard key={tc.toolUseId} toolCall={tc} />
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {messagesWithTools.length === 0 && !isUsingTools ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <svg className="w-8 h-8 text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-xs text-slate-500">No agent activity yet.</p>
            <p className="text-xs text-slate-600 mt-1">Tool calls will appear here as the agent works.</p>
          </div>
        ) : (
          messagesWithTools.map((msg) => (
            <MessageToolGroup
              key={msg.id}
              messageContent={msg.content}
              timestamp={msg.timestamp}
              toolCalls={msg.toolCalls!}
            />
          ))
        )}
      </div>
    </div>
  );
}
