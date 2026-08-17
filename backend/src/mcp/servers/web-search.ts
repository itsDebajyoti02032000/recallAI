import type { MCPServer } from '../types';

export const webSearchServer: MCPServer = {
  name: 'web_search',
  description: 'Web search and content fetching capabilities (coming in Stage 2C)',
  tools: [
    {
      name: 'web_search',
      description: 'Search the web for current information. Returns search results with titles, snippets, and URLs.',
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
      description: 'Fetch and extract text content from a specific URL.',
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
    web_search: async () => ({
      success: false,
      error: 'Web search is not yet available. This feature is coming soon in Stage 2C.',
    }),
    web_fetch: async () => ({
      success: false,
      error: 'Web fetch is not yet available. This feature is coming soon in Stage 2C.',
    }),
  },
};
