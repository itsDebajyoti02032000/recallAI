import { useState } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { Message } from '../../stores/chatStore';

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

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
            {message.isStreaming && !message.content ? (
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
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
