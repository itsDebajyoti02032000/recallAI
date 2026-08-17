import type { Memory, MemoryType } from '../../../shared/types';

export interface CreateMemoryInput {
  userId: string;
  type: MemoryType;
  content: string;
  importance: number;
  embedding: number[] | null;
  sourceConversationId?: string;
  sourceMessageId?: string;
}

function rowToMemory(row: any): Memory {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as MemoryType,
    content: row.content,
    importance: row.importance,
    sourceConversationId: row.source_conversation_id || undefined,
    sourceMessageId: row.source_message_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    accessedAt: row.accessed_at,
    accessCount: row.access_count,
  };
}

export async function createMemory(db: D1Database, input: CreateMemoryInput): Promise<Memory> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const embeddingJson = input.embedding ? JSON.stringify(input.embedding) : null;

  await db
    .prepare(
      `INSERT INTO memories (id, user_id, type, content, importance, embedding, source_conversation_id, source_message_id, created_at, updated_at, accessed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      input.userId,
      input.type,
      input.content,
      input.importance,
      embeddingJson,
      input.sourceConversationId || null,
      input.sourceMessageId || null,
      now,
      now,
      now
    )
    .run();

  return {
    id,
    userId: input.userId,
    type: input.type,
    content: input.content,
    importance: input.importance,
    sourceConversationId: input.sourceConversationId,
    sourceMessageId: input.sourceMessageId,
    createdAt: now,
    updatedAt: now,
    accessedAt: now,
    accessCount: 0,
  };
}

export async function getMemoriesByUser(
  db: D1Database,
  userId: string,
  opts?: { type?: MemoryType; limit?: number; offset?: number }
): Promise<{ memories: Memory[]; total: number }> {
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  let countQuery = 'SELECT COUNT(*) as total FROM memories WHERE user_id = ?';
  let dataQuery = 'SELECT * FROM memories WHERE user_id = ?';
  const params: any[] = [userId];

  if (opts?.type) {
    countQuery += ' AND type = ?';
    dataQuery += ' AND type = ?';
    params.push(opts.type);
  }

  dataQuery += ' ORDER BY importance DESC, updated_at DESC LIMIT ? OFFSET ?';

  const countResult = await db.prepare(countQuery).bind(...params).first<{ total: number }>();
  const dataResult = await db
    .prepare(dataQuery)
    .bind(...params, limit, offset)
    .all();

  return {
    memories: (dataResult.results || []).map(rowToMemory),
    total: countResult?.total ?? 0,
  };
}

export async function getMemoryById(db: D1Database, id: string, userId: string): Promise<Memory | null> {
  const row = await db
    .prepare('SELECT * FROM memories WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .first();

  return row ? rowToMemory(row) : null;
}

export async function updateMemory(
  db: D1Database,
  id: string,
  userId: string,
  updates: { content?: string; importance?: number; type?: MemoryType; embedding?: number[] }
): Promise<Memory | null> {
  const setClauses: string[] = ['updated_at = datetime(\'now\')'];
  const params: any[] = [];

  if (updates.content !== undefined) {
    setClauses.push('content = ?');
    params.push(updates.content);
  }
  if (updates.importance !== undefined) {
    setClauses.push('importance = ?');
    params.push(updates.importance);
  }
  if (updates.type !== undefined) {
    setClauses.push('type = ?');
    params.push(updates.type);
  }
  if (updates.embedding !== undefined) {
    setClauses.push('embedding = ?');
    params.push(JSON.stringify(updates.embedding));
  }

  params.push(id, userId);

  await db
    .prepare(`UPDATE memories SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`)
    .bind(...params)
    .run();

  return getMemoryById(db, id, userId);
}

export async function deleteMemory(db: D1Database, id: string, userId: string): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM memories WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .run();

  return (result.meta?.changes ?? 0) > 0;
}

export async function getMemoriesWithEmbeddings(
  db: D1Database,
  userId: string
): Promise<(Memory & { embedding: number[] })[]> {
  const result = await db
    .prepare('SELECT * FROM memories WHERE user_id = ? AND embedding IS NOT NULL ORDER BY importance DESC LIMIT 500')
    .bind(userId)
    .all();

  return (result.results || []).map((row: any) => ({
    ...rowToMemory(row),
    embedding: JSON.parse(row.embedding),
  }));
}

export async function recordAccess(db: D1Database, ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const placeholders = ids.map(() => '?').join(', ');
  await db
    .prepare(
      `UPDATE memories SET accessed_at = datetime('now'), access_count = access_count + 1 WHERE id IN (${placeholders})`
    )
    .bind(...ids)
    .run();
}

export async function findDuplicateMemory(
  db: D1Database,
  userId: string,
  content: string
): Promise<Memory | null> {
  const normalized = content.toLowerCase().trim();
  const results = await db
    .prepare('SELECT * FROM memories WHERE user_id = ? AND type != \'episodic\'')
    .bind(userId)
    .all();

  for (const row of results.results || []) {
    const existingNormalized = (row.content as string).toLowerCase().trim();
    if (existingNormalized === normalized || normalized.includes(existingNormalized) || existingNormalized.includes(normalized)) {
      return rowToMemory(row);
    }
  }

  return null;
}

export async function getMemoryStats(
  db: D1Database,
  userId: string
): Promise<{ total: number; facts: number; preferences: number; episodic: number }> {
  const result = await db
    .prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN type = 'fact' THEN 1 ELSE 0 END) as facts,
        SUM(CASE WHEN type = 'preference' THEN 1 ELSE 0 END) as preferences,
        SUM(CASE WHEN type = 'episodic' THEN 1 ELSE 0 END) as episodic
      FROM memories WHERE user_id = ?`
    )
    .bind(userId)
    .first<{ total: number; facts: number; preferences: number; episodic: number }>();

  return {
    total: result?.total ?? 0,
    facts: result?.facts ?? 0,
    preferences: result?.preferences ?? 0,
    episodic: result?.episodic ?? 0,
  };
}
