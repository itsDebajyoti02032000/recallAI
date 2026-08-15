import { useState } from 'react';
import { useConnectionStore } from '../../stores/connectionStore';
import { BEDROCK_MODELS } from '../../lib/models';

export function ModelSelector() {
  const modelId = useConnectionStore((s) => s.modelId);
  const setField = useConnectionStore((s) => s.setField);
  const [useCustom, setUseCustom] = useState(false);

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">
        Model
      </label>
      {!useCustom ? (
        <>
          <select
            value={modelId}
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                setUseCustom(true);
                setField('modelId', '');
              } else {
                setField('modelId', e.target.value);
              }
            }}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Select a model...</option>
            {BEDROCK_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.provider}
              </option>
            ))}
            <option value="__custom__">Custom Model ID...</option>
          </select>
        </>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={modelId}
            onChange={(e) => setField('modelId', e.target.value)}
            placeholder="e.g., anthropic.claude-sonnet-4-20250514-v1:0"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => setUseCustom(false)}
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            Back to model list
          </button>
        </div>
      )}
    </div>
  );
}
