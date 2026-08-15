import { useState } from 'react';
import { useConnectionStore } from '../../stores/connectionStore';
import { API_BASE } from '../../lib/config';

interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

export function ModelSelector() {
  const modelId = useConnectionStore((s) => s.modelId);
  const region = useConnectionStore((s) => s.region);
  const accessKeyId = useConnectionStore((s) => s.accessKeyId);
  const secretAccessKey = useConnectionStore((s) => s.secretAccessKey);
  const sessionToken = useConnectionStore((s) => s.sessionToken);
  const setField = useConnectionStore((s) => s.setField);

  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [useCustom, setUseCustom] = useState(false);

  const fetchModels = async () => {
    if (!accessKeyId || !secretAccessKey) {
      setFetchError('Enter your credentials first.');
      return;
    }

    setLoading(true);
    setFetchError(null);

    try {
      const response = await fetch(`${API_BASE}/api/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentials: {
            region,
            accessKeyId,
            secretAccessKey,
            ...(sessionToken && { sessionToken }),
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setModels(data.models);
        setFetched(true);
      } else {
        setFetchError(data.error || 'Failed to fetch models.');
      }
    } catch {
      setFetchError('Unable to connect to API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">
        Model
      </label>

      {!useCustom ? (
        <div className="space-y-2">
          {!fetched ? (
            <>
              <button
                type="button"
                onClick={fetchModels}
                disabled={loading}
                className="w-full py-2 px-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 disabled:cursor-not-allowed text-sm text-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Fetching models...
                  </>
                ) : (
                  'Load Available Models'
                )}
              </button>
              {fetchError && (
                <p className="text-xs text-red-400">{fetchError}</p>
              )}
            </>
          ) : (
            <>
              <select
                value={modelId}
                onChange={(e) => setField('modelId', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select a model...</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.provider}
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setFetched(false); setModels([]); setField('modelId', ''); }}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Refresh models
                </button>
                <span className="text-xs text-slate-500">{models.length} models available</span>
              </div>
            </>
          )}
          <button
            type="button"
            onClick={() => setUseCustom(true)}
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            Enter model ID manually
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={modelId}
            onChange={(e) => setField('modelId', e.target.value)}
            placeholder="e.g., us.anthropic.claude-3-5-sonnet-20241022-v2:0"
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
