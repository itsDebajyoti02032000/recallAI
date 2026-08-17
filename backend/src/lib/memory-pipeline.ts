import type { Credentials, ChatMessage } from '../../../shared/types';
import { extractMemories } from './memory-extractor';
import { generateEmbedding } from './embeddings';
import { createMemory, findDuplicateMemory, getMemoriesByUser, updateMemory } from './memory-store';

export async function extractAndStoreMemories(
  db: D1Database,
  credentials: Credentials,
  modelId: string,
  messages: ChatMessage[],
  userId: string,
  conversationId: string
): Promise<void> {
  try {
    const { memories: existing } = await getMemoriesByUser(db, userId, { limit: 100 });
    const existingContents = existing.map((m) => m.content);

    const extracted = await extractMemories(credentials, modelId, messages, existingContents);

    for (const item of extracted) {
      const duplicate = await findDuplicateMemory(db, userId, item.content);

      if (duplicate) {
        if (item.importance > duplicate.importance) {
          await updateMemory(db, duplicate.id, userId, {
            content: item.content,
            importance: item.importance,
          });
        }
        continue;
      }

      let embedding: number[] | null = null;
      try {
        embedding = await generateEmbedding(credentials, item.content);
      } catch {
        // Store without embedding; can be generated later
      }

      await createMemory(db, {
        userId,
        type: item.type,
        content: item.content,
        importance: item.importance,
        embedding,
        sourceConversationId: conversationId,
      });
    }
  } catch {
    // Memory extraction is best-effort; never block the chat flow
  }
}
