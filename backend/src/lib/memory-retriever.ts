import type { Credentials, Memory } from '../../../shared/types';
import { generateEmbedding, cosineSimilarity } from './embeddings';
import { getMemoriesWithEmbeddings, recordAccess } from './memory-store';

export interface RetrievedMemory extends Memory {
  similarity: number;
}

export async function retrieveRelevantMemories(
  db: D1Database,
  credentials: Credentials,
  userId: string,
  query: string,
  opts?: { limit?: number; minSimilarity?: number }
): Promise<RetrievedMemory[]> {
  const limit = opts?.limit ?? 10;
  const minSimilarity = opts?.minSimilarity ?? 0.3;

  let queryEmbedding: number[];
  try {
    queryEmbedding = await generateEmbedding(credentials, query);
  } catch {
    return [];
  }

  const memories = await getMemoriesWithEmbeddings(db, userId);
  if (memories.length === 0) return [];

  const scored = memories.map((memory) => {
    const similarity = cosineSimilarity(queryEmbedding, memory.embedding);
    const weightedScore = similarity * 0.7 + (memory.importance / 10) * 0.3;
    return { ...memory, similarity: weightedScore };
  });

  const filtered = scored
    .filter((m) => m.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  if (filtered.length > 0) {
    await recordAccess(db, filtered.map((m) => m.id));
  }

  return filtered.map(({ embedding, ...rest }) => rest);
}

export function buildMemoryContext(memories: RetrievedMemory[]): string {
  if (memories.length === 0) return '';

  const lines = memories.map((m) => {
    const typeLabel = m.type === 'fact' ? 'Fact' : m.type === 'preference' ? 'Preference' : 'Context';
    return `- [${typeLabel}] ${m.content}`;
  });

  return `## What you remember about this user:\n${lines.join('\n')}`;
}
