import { useAgentStore } from '../../stores/agentStore';
import { ToolCallCard } from './ToolCallCard';

export function AgentActivityPanel() {
  const activeToolCalls = useAgentStore((s) => s.activeToolCalls);

  if (activeToolCalls.length === 0) return null;

  return (
    <div className="mt-2 px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg space-y-1.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 font-medium">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Agent Activity
      </div>
      {activeToolCalls.map((tc) => (
        <ToolCallCard key={tc.toolUseId} toolCall={tc} />
      ))}
    </div>
  );
}
