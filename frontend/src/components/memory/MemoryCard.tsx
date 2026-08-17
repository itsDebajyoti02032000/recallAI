import { useState } from 'react';
import type { Memory } from '@recallai/shared';
import { useMemoryStore } from '../../stores/memoryStore';

const TYPE_STYLES = {
  fact: 'bg-blue-500/20 text-blue-400',
  preference: 'bg-purple-500/20 text-purple-400',
  episodic: 'bg-amber-500/20 text-amber-400',
};

const TYPE_LABELS = {
  fact: 'Fact',
  preference: 'Preference',
  episodic: 'Episodic',
};

interface MemoryCardProps {
  memory: Memory;
  isActive: boolean;
}

export function MemoryCard({ memory, isActive }: MemoryCardProps) {
  const { deleteMemory, updateMemory } = useMemoryStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(memory.content);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    if (editContent.trim() && editContent !== memory.content) {
      await updateMemory(memory.id, { content: editContent.trim() });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (isDeleting) {
      await deleteMemory(memory.id);
    } else {
      setIsDeleting(true);
      setTimeout(() => setIsDeleting(false), 3000);
    }
  };

  const importanceDots = Array.from({ length: 10 }, (_, i) => (
    <div
      key={i}
      className={`w-1.5 h-1.5 rounded-full ${
        i < memory.importance ? 'bg-indigo-400' : 'bg-slate-700'
      }`}
    />
  ));

  return (
    <div
      className={`p-3 border border-slate-700 rounded-lg transition-all ${
        isActive ? 'ring-1 ring-indigo-500 bg-indigo-500/5' : 'hover:border-slate-600'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${TYPE_STYLES[memory.type]}`}>
          {TYPE_LABELS[memory.type]}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
            title="Edit"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className={`p-1 transition-colors ${isDeleting ? 'text-red-400' : 'text-slate-500 hover:text-red-400'}`}
            title={isDeleting ? 'Click again to confirm' : 'Delete'}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-slate-200 resize-none focus:outline-none focus:border-indigo-500"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-2.5 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => { setIsEditing(false); setEditContent(memory.content); }}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-300 leading-relaxed">{memory.content}</p>
      )}

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
        <div className="flex gap-0.5" title={`Importance: ${memory.importance}/10`}>
          {importanceDots}
        </div>
        <span className="text-[10px] text-slate-500">
          {new Date(memory.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
