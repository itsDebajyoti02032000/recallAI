import { useState } from 'react';
import type { SearchSource } from '../../../../shared/types';

interface Props {
  sources: SearchSource[];
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export function SourcesCitation({ sources }: Props) {
  const [expanded, setExpanded] = useState(false);
  const visibleSources = expanded ? sources : sources.slice(0, 3);
  const hasMore = sources.length > 3;

  return (
    <div className="mt-1.5">
      <div className="flex items-center gap-1.5 mb-1">
        <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        <span className="text-[10px] text-blue-400 font-medium uppercase tracking-wide">Sources</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visibleSources.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-500/20 hover:text-blue-300 transition-colors max-w-[200px]"
            title={source.title}
          >
            <span className="truncate">{source.title || getHostname(source.url)}</span>
            <span className="text-blue-400/50 flex-shrink-0">{getHostname(source.url)}</span>
          </a>
        ))}
        {hasMore && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="px-2 py-0.5 text-[11px] text-blue-400/70 hover:text-blue-400 transition-colors"
          >
            +{sources.length - 3} more
          </button>
        )}
      </div>
    </div>
  );
}
