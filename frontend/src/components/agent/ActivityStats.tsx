import type { ToolCall } from '../../../../shared/types';

interface Props {
  toolCalls: ToolCall[];
}

export function ActivityStats({ toolCalls }: Props) {
  const total = toolCalls.length;
  const memoryOps = toolCalls.filter((tc) => tc.toolName.startsWith('memory_')).length;
  const webSearches = toolCalls.filter((tc) => tc.toolName === 'web_search' || tc.toolName === 'web_fetch').length;
  const errors = toolCalls.filter((tc) => tc.status === 'error').length;

  return (
    <div className="grid grid-cols-4 gap-2 px-3 py-2 border-b border-slate-700">
      <StatItem label="Total" value={total} color="text-slate-200" />
      <StatItem label="Memory" value={memoryOps} color="text-indigo-400" />
      <StatItem label="Web" value={webSearches} color="text-blue-400" />
      <StatItem label="Errors" value={errors} color="text-red-400" />
    </div>
  );
}

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-sm font-semibold ${color}`}>{value}</div>
      <div className="text-[10px] text-slate-500 uppercase">{label}</div>
    </div>
  );
}
