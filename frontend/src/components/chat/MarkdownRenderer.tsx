import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState, type HTMLAttributes } from 'react';

interface Props {
  content: string;
}

export function MarkdownRenderer({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-pre:my-2"
      components={{
        code(props: HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
          const { className, children, ...rest } = props;
          const match = /language-(\w+)/.exec(className || '');
          const codeString = String(children).replace(/\n$/, '');

          if (match) {
            return <CodeBlock language={match[1]!} code={codeString} />;
          }

          return (
            <code className="px-1.5 py-0.5 bg-slate-700 rounded text-sm" {...rest}>
              {children}
            </code>
          );
        },
        a({ href, children }) {
          const isExternal = href?.startsWith('http');
          return (
            <a
              href={href}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 hover:decoration-blue-400 transition-colors"
            >
              {children}
              {isExternal && (
                <svg className="inline-block w-3 h-3 ml-0.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              )}
            </a>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden my-3">
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-700 text-xs text-slate-400">
        <span>{language}</span>
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-slate-200"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, borderRadius: 0 }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
