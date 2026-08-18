import type { ToolCall } from '../../../../shared/types';
import { DetailedToolCallCard } from './DetailedToolCallCard';

interface Props {
  messageContent: string;
  timestamp: number;
  toolCalls: ToolCall[];
}

export function MessageToolGroup({ messageContent, timestamp, toolCalls }: Props) {
  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const snippet = messageContent.slice(0, 50) + (messageContent.length > 50 ? '...' : '');

  return (
    <div className="px-3 py-2 border-b border-slate-800">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] text-slate-500">{time}</span>
        <span className="text-[11px] text-slate-400 truncate flex-1">{snippet}</span>
        <span className="text-[10px] text-slate-600">{toolCalls.length} call{toolCalls.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="space-y-1.5">
        {toolCalls.map((tc) => (
          <DetailedToolCallCard key={tc.toolUseId} toolCall={tc} />
        ))}
      </div>
    </div>
  );
}
