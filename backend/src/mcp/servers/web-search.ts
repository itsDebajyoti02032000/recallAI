import type { MCPServer, ToolHandler } from '../types';
import { search } from '../../lib/searxng';
import { extractPageContent } from '../../lib/html-extractor';

const handleWebSearch: ToolHandler = async (input) => {
  const query = input.query as string;
  const maxResults = (input.maxResults as number) || 5;

  if (!query?.trim()) {
    return { success: false, error: 'Search query is required.' };
  }

  try {
    const response = await search(query.trim(), maxResults);
    return { success: true, data: response };
  } catch (err: any) {
    return { success: false, error: err.message || 'Web search failed.' };
  }
};

const handleWebFetch: ToolHandler = async (input) => {
  const url = input.url as string;

  if (!url?.trim()) {
    return { success: false, error: 'URL is required.' };
  }

  try {
    new URL(url);
  } catch {
    return { success: false, error: 'Invalid URL format.' };
  }

  try {
    const extracted = await extractPageContent(url.trim());
    return {
      success: true,
      data: {
        url,
        title: extracted.title,
        content: extracted.content,
        contentLength: extracted.content.length,
        truncated: extracted.truncated,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch page content.' };
  }
};

export const webSearchServer: MCPServer = {
  name: 'web_search',
  description: 'Web search and content fetching capabilities',
  tools: [
    {
      name: 'web_search',
      description:
        'Search the web for current information. Use this for recent events, news, current docs/versions, or anything that may have changed after your training cutoff. Returns results with titles, snippets, and URLs.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          maxResults: { type: 'number', description: 'Maximum results to return (1-10, default 5)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'web_fetch',
      description:
        'Fetch and extract text content from a specific URL. Use this to read the full content of a page found via web_search when you need more detail than the snippet provides.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The URL to fetch content from' },
        },
        required: ['url'],
      },
    },
  ],
  handlers: {
    web_search: handleWebSearch,
    web_fetch: handleWebFetch,
  },
};
