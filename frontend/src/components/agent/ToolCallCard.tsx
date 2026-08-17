import type { ToolCall } from '../../../../shared/types';

interface Props {
  toolCall: ToolCall;
}

const TOOL_LABELS: Record<string, string> = {
  memory_search: 'Searching memories',
  memory_add: 'Storing memory',
  memory_get: 'Reading memory',
  memory_update: 'Updating memory',
  memory_delete: 'Deleting memory',
  memory_list: 'Listing memories',
  web_search: 'Searching the web',
  web_fetch: 'Fetching page',
};

function ToolIcon({ toolName }: { toolName: string }) {
  if (toolName.startsWith('memory_')) {
    return (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    );
  }
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

export function ToolCallCard({ toolCall }: Props) {
  const label = TOOL_LABELS[toolCall.toolName] || toolCall.toolName;
  const isRunning = toolCall.status === 'running';
  const isError = toolCall.status === 'error';

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`${isRunning ? 'text-amber-400' : isError ? 'text-red-400' : 'text-emerald-400'}`}>
        <ToolIcon toolName={toolCall.toolName} />
      </span>
      <span className="text-slate-300">{label}</span>
      {isRunning && (
        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
      )}
      {toolCall.status === 'completed' && (
        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {isError && (
        <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </div>
  );
}
