import { useState } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useMemoryStore } from '../../stores/memoryStore';
import { useAgentStore } from '../../stores/agentStore';
import { AgentActivityPanel } from '../agent/AgentActivityPanel';
import type { Message } from '../../stores/chatStore';

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const [copied, setCopied] = useState(false);
  const activeMemoryIds = useMemoryStore((s) => s.activeMemoryIds);
  const togglePanel = useMemoryStore((s) => s.togglePanel);
  const activeToolCalls = useAgentStore((s) => s.activeToolCalls);
  const isUser = message.role === 'user';
  const hasMemoryContext = !isUser && activeMemoryIds.length > 0;
  const showAgentActivity = !isUser && message.isStreaming && activeToolCalls.length > 0;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-800 border border-slate-700 text-slate-100'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <>
            {showAgentActivity && <AgentActivityPanel />}
            {message.isStreaming && !message.content && activeToolCalls.length === 0 ? (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <MarkdownRenderer content={message.content} />
            )}
            {message.content && !message.isStreaming && (
              <div className="mt-2 flex items-center gap-2 border-t border-slate-700 pt-2">
                <button
                  onClick={handleCopy}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                {hasMemoryContext && (
                  <button
                    onClick={togglePanel}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    title="This response used memories"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Memory
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
