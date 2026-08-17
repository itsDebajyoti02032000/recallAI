import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import type { Credentials, ChatMessage, MemoryType } from '../../../shared/types';
import { createBedrockClient } from './bedrock';

export interface ExtractedMemory {
  content: string;
  type: MemoryType;
  importance: number;
}

const EXTRACTION_PROMPT = `You are a memory extraction system for an AI assistant. Analyze the conversation and extract NEW facts, preferences, or episodic summaries about the user.

Memory types:
- "fact": Concrete information about the user (name, job, location, family, skills, projects)
- "preference": User likes, dislikes, communication style preferences, tool preferences
- "episodic": Summary of a notable interaction topic or outcome worth remembering

Rules:
- Only extract information explicitly stated or strongly implied by the USER (not the assistant)
- Each memory should be a single, atomic fact or preference
- Rate importance 1-10:
  - 9-10: Core identity (name, profession, major life facts)
  - 7-8: Important context (current projects, key preferences, expertise areas)
  - 5-6: Useful details (minor preferences, specific tools used)
  - 3-4: Contextual (one-time mentions, temporary states)
  - 1-2: Trivial (passing comments unlikely to be relevant again)
- Do NOT extract information the assistant said about itself
- Do NOT duplicate already known facts listed below
- Return a valid JSON array, or an empty array [] if nothing memorable was said

Output format (JSON array only, no markdown):
[{"content": "...", "type": "fact|preference|episodic", "importance": N}]`;

export async function extractMemories(
  credentials: Credentials,
  modelId: string,
  messages: ChatMessage[],
  existingMemories: string[]
): Promise<ExtractedMemory[]> {
  const client = createBedrockClient(credentials);

  const recentMessages = messages.slice(-6);

  const existingContext = existingMemories.length > 0
    ? `\n\nAlready known facts (do NOT duplicate these):\n${existingMemories.map(m => `- ${m}`).join('\n')}`
    : '';

  const conversationText = recentMessages
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  const userPrompt = `${existingContext}\n\nConversation to analyze:\n${conversationText}\n\nExtract new memories as JSON:`;

  try {
    const command = new ConverseCommand({
      modelId,
      system: [{ text: EXTRACTION_PROMPT }],
      messages: [{ role: 'user', content: [{ text: userPrompt }] }],
      inferenceConfig: {
        maxTokens: 1024,
        temperature: 0,
      },
    });

    const response = await client.send(command);
    const responseText = response.output?.message?.content?.[0]?.text || '[]';

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item: any) =>
          item.content &&
          typeof item.content === 'string' &&
          ['fact', 'preference', 'episodic'].includes(item.type) &&
          typeof item.importance === 'number' &&
          item.importance >= 1 &&
          item.importance <= 10
      )
      .map((item: any) => ({
        content: item.content.trim(),
        type: item.type as MemoryType,
        importance: Math.round(item.importance),
      }));
  } catch {
    return [];
  }
}
