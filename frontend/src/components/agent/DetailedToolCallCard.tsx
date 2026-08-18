import { useState } from 'react';
import type { ToolCall } from '../../../../shared/types';

interface Props {
  toolCall: ToolCall;
}

const TOOL_LABELS: Record<string, string> = {
  memory_search: 'Search memories',
  memory_add: 'Store memory',
  memory_get: 'Read memory',
  memory_update: 'Update memory',
  memory_delete: 'Delete memory',
  memory_list: 'List memories',
  web_search: 'Web search',
  web_fetch: 'Fetch page',
};

export function DetailedToolCallCard({ toolCall }: Props) {
  const [expanded, setExpanded] = useState(false);
  const label = TOOL_LABELS[toolCall.toolName] || toolCall.toolName;
  const isError = toolCall.status === 'error';
  const duration = toolCall.completedAt
    ? ((toolCall.completedAt - toolCall.startedAt) / 1000).toFixed(1) + 's'
    : null;

  return (
    <div className="border border-slate-700/50 rounded-md overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-slate-800/50 transition-colors"
      >
        <ToolIcon toolName={toolCall.toolName} />
        <span className="text-xs text-slate-300 flex-1 truncate">{label}</span>
        {duration && (
          <span className="text-[10px] text-slate-500">{duration}</span>
        )}
        <StatusBadge status={toolCall.status} />
        <svg
          className={`w-3 h-3 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-2.5 py-2 border-t border-slate-700/50 bg-slate-900/50 space-y-2">
          {toolCall.input && Object.keys(toolCall.input).length > 0 && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase mb-0.5">Input</div>
              <pre className="text-[11px] text-slate-400 bg-slate-800 rounded p-1.5 overflow-x-auto max-h-24 overflow-y-auto">
                {JSON.stringify(toolCall.input, null, 2)}
              </pre>
            </div>
          )}
          {toolCall.result !== undefined && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase mb-0.5">
                {isError ? 'Error' : 'Result'}
              </div>
              <pre className={`text-[11px] rounded p-1.5 overflow-x-auto max-h-32 overflow-y-auto ${
                isError ? 'text-red-400 bg-red-500/5' : 'text-slate-400 bg-slate-800'
              }`}>
                {formatResult(toolCall.result)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatResult(result: unknown): string {
  const str = JSON.stringify(result, null, 2);
  if (str.length > 500) return str.slice(0, 500) + '\n...';
  return str;
}

function ToolIcon({ toolName }: { toolName: string }) {
  if (toolName.startsWith('memory_')) {
    return (
      <svg className="w-3 h-3 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    );
  }
  return (
    <svg className="w-3 h-3 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function StatusBadge({ status }: { status: ToolCall['status'] }) {
  if (status === 'completed') {
    return (
      <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (status === 'error') {
    return (
      <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }
  return <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />;
}
