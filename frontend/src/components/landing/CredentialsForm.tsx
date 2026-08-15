import { useConnectionStore } from '../../stores/connectionStore';
import { RegionSelector } from './RegionSelector';
import { ModelSelector } from './ModelSelector';

export function CredentialsForm() {
  const {
    accessKeyId,
    secretAccessKey,
    isValidating,
    error,
    setField,
    validate,
  } = useConnectionStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await validate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <RegionSelector />

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          AWS Access Key ID
        </label>
        <input
          type="text"
          value={accessKeyId}
          onChange={(e) => setField('accessKeyId', e.target.value)}
          placeholder="AKIAIOSFODNN7EXAMPLE"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          autoComplete="off"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          AWS Secret Access Key
        </label>
        <input
          type="password"
          value={secretAccessKey}
          onChange={(e) => setField('secretAccessKey', e.target.value)}
          placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          autoComplete="off"
        />
      </div>

      <ModelSelector />

      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isValidating}
        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800"
      >
        {isValidating ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Validating...
          </span>
        ) : (
          'Connect to Bedrock'
        )}
      </button>
    </form>
  );
}
