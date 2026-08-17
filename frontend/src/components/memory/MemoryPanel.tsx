import { useMemoryStore } from '../../stores/memoryStore';
import { MemoryFilters } from './MemoryFilters';
import { MemoryCard } from './MemoryCard';

export function MemoryPanel() {
  const { memories, isLoading, stats, activeMemoryIds, togglePanel } = useMemoryStore();

  return (
    <div className="w-80 h-full border-l border-slate-700 bg-slate-900 flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h2 className="text-sm font-semibold text-slate-200">Memory Inspector</h2>
        </div>
        <button
          onClick={togglePanel}
          className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-1 p-3 border-b border-slate-700">
          <div className="text-center">
            <div className="text-lg font-bold text-slate-200">{stats.total}</div>
            <div className="text-[10px] text-slate-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">{stats.facts}</div>
            <div className="text-[10px] text-slate-500">Facts</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">{stats.preferences}</div>
            <div className="text-[10px] text-slate-500">Prefs</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-400">{stats.episodic}</div>
            <div className="text-[10px] text-slate-500">Episodic</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <MemoryFilters />

      {/* Memory List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : memories.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-10 h-10 mx-auto text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-sm text-slate-500">No memories yet</p>
            <p className="text-xs text-slate-600 mt-1">Chat with RecallAI to start building memories</p>
          </div>
        ) : (
          memories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              isActive={activeMemoryIds.includes(memory.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
