import { useConnectionStore } from '../../stores/connectionStore';
import { AWS_REGIONS } from '../../lib/regions';

export function RegionSelector() {
  const region = useConnectionStore((s) => s.region);
  const setField = useConnectionStore((s) => s.setField);

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">
        AWS Region
      </label>
      <select
        value={region}
        onChange={(e) => setField('region', e.target.value)}
        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
        {AWS_REGIONS.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name} ({r.id})
          </option>
        ))}
      </select>
    </div>
  );
}
