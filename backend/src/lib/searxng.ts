export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  engine: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  resultCount: number;
}

interface SearXNGResult {
  title: string;
  url: string;
  content: string;
  engine: string;
  category?: string;
  parsed_url?: string[];
}

interface SearXNGAPIResponse {
  query: string;
  results: SearXNGResult[];
  suggestions?: string[];
  number_of_results?: number;
}

// Public SearXNG instances that support JSON API
// See: https://searx.space for a live list of available instances
const INSTANCES = [
  'https://search.sapti.me',
  'https://searx.be',
  'https://paulgo.io',
  'https://searx.tiekoetter.com',
  'https://opnxng.com',
  'https://search.bus-hit.me',
  'https://priv.au',
  'https://search.rhscz.eu',
  'https://etsi.me',
  'https://search.inetol.net',
];

let currentIndex = 0;

/**
 * Search the web via SearXNG public instances.
 * Uses instance rotation with fallback on failure.
 * Official API docs: https://docs.searxng.org/dev/search_api.html
 */
export async function search(query: string, maxResults = 5): Promise<SearchResponse> {
  const clampedMax = Math.min(Math.max(maxResults, 1), 10);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < INSTANCES.length; attempt++) {
    const index = (currentIndex + attempt) % INSTANCES.length;
    const instance = INSTANCES[index];

    try {
      const result = await fetchFromInstance(instance!, query, clampedMax);
      // Advance past this instance for next call (spreads load)
      currentIndex = (index + 1) % INSTANCES.length;
      return result;
    } catch (err: any) {
      lastError = err;
    }
  }

  throw new Error(
    lastError?.message || 'Web search is temporarily unavailable. All search instances are unreachable.'
  );
}

async function fetchFromInstance(
  instance: string,
  query: string,
  maxResults: number
): Promise<SearchResponse> {
  // SearXNG Search API parameters
  // Docs: https://docs.searxng.org/dev/search_api.html
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    categories: 'general',
    language: 'auto',
    safesearch: '0',
    pageno: '1',
  });

  const response = await fetch(`${instance}/search?${params.toString()}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`${instance} returned HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
    // Some instances return HTML (captcha/anti-bot) instead of JSON
    throw new Error(`${instance} returned non-JSON response`);
  }

  const data = (await response.json()) as SearXNGAPIResponse;

  if (!data.results || !Array.isArray(data.results)) {
    throw new Error(`${instance} returned invalid response structure`);
  }

  const results: SearchResult[] = data.results
    .filter((r) => r.title && r.url)
    .slice(0, maxResults)
    .map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content || '',
      engine: r.engine || 'unknown',
    }));

  return { results, query: data.query || query, resultCount: results.length };
}
