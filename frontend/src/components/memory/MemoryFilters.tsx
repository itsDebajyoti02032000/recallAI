import { useMemoryStore } from '../../stores/memoryStore';
import type { MemoryType } from '@recallai/shared';

const FILTERS: { label: string; value: MemoryType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Facts', value: 'fact' },
  { label: 'Preferences', value: 'preference' },
  { label: 'Episodic', value: 'episodic' },
];

export function MemoryFilters() {
  const { filter, setFilter } = useMemoryStore();

  return (
    <div className="flex gap-1 p-3 border-b border-slate-700">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => setFilter(f.value)}
          className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
            filter === f.value
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
