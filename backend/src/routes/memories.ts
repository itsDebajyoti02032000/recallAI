import { Hono } from 'hono';
import type { Env } from '../types/env';
import { hashAccessKeyId } from '../lib/user-identity';
import { getMemoriesByUser, updateMemory, deleteMemory, getMemoryStats } from '../lib/memory-store';
import { retrieveRelevantMemories } from '../lib/memory-retriever';
import { generateEmbedding } from '../lib/embeddings';
import type { MemoryType } from '../../../shared/types';

export const memoriesRoute = new Hono<{ Bindings: Env }>();

memoriesRoute.post('/memories/list', async (c) => {
  try {
    const body = await c.req.json();
    const { credentials, type, limit, offset } = body;

    if (!credentials?.accessKeyId) {
      return c.json({ success: false, error: 'Missing credentials.' }, 400);
    }

    const userId = await hashAccessKeyId(credentials.accessKeyId);
    const result = await getMemoriesByUser(c.env.DB, userId, { type, limit, offset });

    return c.json({ success: true, memories: result.memories, total: result.total });
  } catch {
    return c.json({ success: false, error: 'Failed to fetch memories.' }, 500);
  }
});

memoriesRoute.post('/memories/search', async (c) => {
  try {
    const body = await c.req.json();
    const { credentials, query, limit } = body;

    if (!credentials?.accessKeyId || !credentials?.secretAccessKey || !credentials?.region) {
      return c.json({ success: false, error: 'Missing credentials.' }, 400);
    }

    if (!query) {
      return c.json({ success: false, error: 'Query is required.' }, 400);
    }

    const userId = await hashAccessKeyId(credentials.accessKeyId);
    const memories = await retrieveRelevantMemories(c.env.DB, credentials, userId, query, { limit });

    return c.json({ success: true, memories });
  } catch {
    return c.json({ success: false, error: 'Search failed.' }, 500);
  }
});

memoriesRoute.post('/memories/update', async (c) => {
  try {
    const body = await c.req.json();
    const { credentials, memoryId, content, importance, type } = body;

    if (!credentials?.accessKeyId || !memoryId) {
      return c.json({ success: false, error: 'Missing credentials or memory ID.' }, 400);
    }

    const userId = await hashAccessKeyId(credentials.accessKeyId);

    const updates: { content?: string; importance?: number; type?: MemoryType; embedding?: number[] } = {};
    if (content !== undefined) updates.content = content;
    if (importance !== undefined) updates.importance = importance;
    if (type !== undefined) updates.type = type;

    if (updates.content && credentials.secretAccessKey && credentials.region) {
      try {
        updates.embedding = await generateEmbedding(credentials, updates.content);
      } catch {
        // Keep old embedding if re-generation fails
      }
    }

    const updated = await updateMemory(c.env.DB, memoryId, userId, updates);

    if (!updated) {
      return c.json({ success: false, error: 'Memory not found.' }, 404);
    }

    return c.json({ success: true, memory: updated });
  } catch {
    return c.json({ success: false, error: 'Update failed.' }, 500);
  }
});

memoriesRoute.post('/memories/delete', async (c) => {
  try {
    const body = await c.req.json();
    const { credentials, memoryId } = body;

    if (!credentials?.accessKeyId || !memoryId) {
      return c.json({ success: false, error: 'Missing credentials or memory ID.' }, 400);
    }

    const userId = await hashAccessKeyId(credentials.accessKeyId);
    const deleted = await deleteMemory(c.env.DB, memoryId, userId);

    if (!deleted) {
      return c.json({ success: false, error: 'Memory not found.' }, 404);
    }

    return c.json({ success: true });
  } catch {
    return c.json({ success: false, error: 'Delete failed.' }, 500);
  }
});

memoriesRoute.post('/memories/stats', async (c) => {
  try {
    const body = await c.req.json();
    const { credentials } = body;

    if (!credentials?.accessKeyId) {
      return c.json({ success: false, error: 'Missing credentials.' }, 400);
    }

    const userId = await hashAccessKeyId(credentials.accessKeyId);
    const stats = await getMemoryStats(c.env.DB, userId);

    return c.json({ success: true, ...stats });
  } catch {
    return c.json({ success: false, error: 'Failed to fetch stats.' }, 500);
  }
});
