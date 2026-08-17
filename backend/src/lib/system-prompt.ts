const BASE_PROMPT = `You are RecallAI, a helpful and knowledgeable AI assistant. Provide clear, accurate, and well-structured responses.`;

export function buildSystemPrompt(memoryContext: string | null): string {
  if (!memoryContext) return BASE_PROMPT;

  return `${BASE_PROMPT}

${memoryContext}

Use these memories naturally in your responses when relevant. Do not explicitly mention that you are "recalling memories" unless the user asks about your memory capabilities.`;
}
