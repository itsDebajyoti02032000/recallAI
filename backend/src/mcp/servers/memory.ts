import type { MCPServer, ToolExecutionContext, ToolResult } from '../types';
import { retrieveRelevantMemories } from '../../lib/memory-retriever';
import { generateEmbedding } from '../../lib/embeddings';
import {
  createMemory,
  getMemoryById,
  getMemoriesByUser,
  updateMemory,
  deleteMemory,
  findDuplicateMemory,
  getMemoryStats,
} from '../../lib/memory-store';
import type { MemoryType } from '../../../../shared/types';

async function handleMemorySearch(
  input: Record<string, unknown>,
  ctx: ToolExecutionContext
): Promise<ToolResult> {
  const query = input.query as string;
  const limit = (input.limit as number) || 5;

  const memories = await retrieveRelevantMemories(
    ctx.db,
    ctx.credentials,
    ctx.userId,
    query,
    { limit }
  );

  return {
    success: true,
    data: {
      memories: memories.map((m) => ({
        id: m.id,
        type: m.type,
        content: m.content,
        importance: m.importance,
        similarity: m.similarity,
      })),
      count: memories.length,
    },
  };
}

async function handleMemoryAdd(
  input: Record<string, unknown>,
  ctx: ToolExecutionContext
): Promise<ToolResult> {
  const content = input.content as string;
  const type = (input.type as MemoryType) || 'fact';
  const importance = (input.importance as number) || 5;

  const duplicate = await findDuplicateMemory(ctx.db, ctx.userId, content);
  if (duplicate) {
    if (importance > duplicate.importance) {
      await updateMemory(ctx.db, duplicate.id, ctx.userId, { content, importance });
    }
    return {
      success: true,
      data: { memoryId: duplicate.id, deduplicated: true, message: 'Updated existing memory.' },
    };
  }

  let embedding: number[] | null = null;
  try {
    embedding = await generateEmbedding(ctx.credentials, content);
  } catch {
    // Store without embedding
  }

  const memory = await createMemory(ctx.db, {
    userId: ctx.userId,
    type,
    content,
    importance,
    embedding,
  });

  return {
    success: true,
    data: { memoryId: memory.id, deduplicated: false, message: 'Memory stored successfully.' },
  };
}

async function handleMemoryGet(
  input: Record<string, unknown>,
  ctx: ToolExecutionContext
): Promise<ToolResult> {
  const memoryId = input.memoryId as string;
  const memory = await getMemoryById(ctx.db, memoryId, ctx.userId);

  if (!memory) {
    return { success: false, error: `Memory not found: ${memoryId}` };
  }

  return {
    success: true,
    data: {
      id: memory.id,
      type: memory.type,
      content: memory.content,
      importance: memory.importance,
      createdAt: memory.createdAt,
      updatedAt: memory.updatedAt,
    },
  };
}

async function handleMemoryUpdate(
  input: Record<string, unknown>,
  ctx: ToolExecutionContext
): Promise<ToolResult> {
  const memoryId = input.memoryId as string;
  const updates: { content?: string; importance?: number; type?: MemoryType; embedding?: number[] } = {};

  if (input.content !== undefined) updates.content = input.content as string;
  if (input.importance !== undefined) updates.importance = input.importance as number;
  if (input.type !== undefined) updates.type = input.type as MemoryType;

  if (updates.content) {
    try {
      updates.embedding = await generateEmbedding(ctx.credentials, updates.content);
    } catch {
      // Continue without re-embedding
    }
  }

  const memory = await updateMemory(ctx.db, memoryId, ctx.userId, updates);
  if (!memory) {
    return { success: false, error: `Memory not found: ${memoryId}` };
  }

  return { success: true, data: { memoryId: memory.id, message: 'Memory updated.' } };
}

async function handleMemoryDelete(
  input: Record<string, unknown>,
  ctx: ToolExecutionContext
): Promise<ToolResult> {
  const memoryId = input.memoryId as string;
  const deleted = await deleteMemory(ctx.db, memoryId, ctx.userId);

  if (!deleted) {
    return { success: false, error: `Memory not found: ${memoryId}` };
  }

  return { success: true, data: { message: 'Memory deleted.' } };
}

async function handleMemoryList(
  input: Record<string, unknown>,
  ctx: ToolExecutionContext
): Promise<ToolResult> {
  const type = input.type as MemoryType | undefined;
  const limit = (input.limit as number) || 10;

  const { memories, total } = await getMemoriesByUser(ctx.db, ctx.userId, { type, limit });

  return {
    success: true,
    data: {
      memories: memories.map((m) => ({
        id: m.id,
        type: m.type,
        content: m.content,
        importance: m.importance,
      })),
      total,
    },
  };
}

async function handleMemoryStats(
  _input: Record<string, unknown>,
  ctx: ToolExecutionContext
): Promise<ToolResult> {
  const stats = await getMemoryStats(ctx.db, ctx.userId);
  return { success: true, data: stats };
}

export const memoryServer: MCPServer = {
  name: 'memory',
  description: 'Long-term memory storage and retrieval for user facts, preferences, and context',
  tools: [
    {
      name: 'memory_search',
      description: 'Search memories semantically. Use when the user asks about something you might have stored, or when past context would improve your answer.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query to find relevant memories' },
          limit: { type: 'number', description: 'Maximum results to return (1-10, default 5)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'memory_add',
      description: 'Store a new memory about the user. Use when the user shares personal facts, preferences, or important context worth remembering.',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'The information to remember' },
          type: { type: 'string', description: 'Memory type', enum: ['fact', 'preference', 'episodic'] },
          importance: { type: 'number', description: 'Importance score 1-10 (default 5)' },
        },
        required: ['content'],
      },
    },
    {
      name: 'memory_get',
      description: 'Retrieve a specific memory by its ID.',
      inputSchema: {
        type: 'object',
        properties: {
          memoryId: { type: 'string', description: 'The memory ID to retrieve' },
        },
        required: ['memoryId'],
      },
    },
    {
      name: 'memory_update',
      description: 'Update an existing memory with new content, importance, or type.',
      inputSchema: {
        type: 'object',
        properties: {
          memoryId: { type: 'string', description: 'The memory ID to update' },
          content: { type: 'string', description: 'New content for the memory' },
          importance: { type: 'number', description: 'New importance score 1-10' },
          type: { type: 'string', description: 'New memory type', enum: ['fact', 'preference', 'episodic'] },
        },
        required: ['memoryId'],
      },
    },
    {
      name: 'memory_delete',
      description: 'Delete a memory permanently.',
      inputSchema: {
        type: 'object',
        properties: {
          memoryId: { type: 'string', description: 'The memory ID to delete' },
        },
        required: ['memoryId'],
      },
    },
    {
      name: 'memory_list',
      description: 'List stored memories, optionally filtered by type.',
      inputSchema: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'Filter by memory type', enum: ['fact', 'preference', 'episodic'] },
          limit: { type: 'number', description: 'Maximum results (default 10)' },
        },
      },
    },
  ],
  handlers: {
    memory_search: handleMemorySearch,
    memory_add: handleMemoryAdd,
    memory_get: handleMemoryGet,
    memory_update: handleMemoryUpdate,
    memory_delete: handleMemoryDelete,
    memory_list: handleMemoryList,
  },
};
