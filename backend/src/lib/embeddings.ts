import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import type { Credentials } from '../../../shared/types';
import { createBedrockClient } from './bedrock';

const EMBEDDING_MODEL_ID = 'amazon.titan-embed-text-v2:0';
const EMBEDDING_DIMENSIONS = 1024;

export async function generateEmbedding(credentials: Credentials, text: string): Promise<number[]> {
  const client = createBedrockClient(credentials);

  const command = new InvokeModelCommand({
    modelId: EMBEDDING_MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      inputText: text.slice(0, 8000),
      dimensions: EMBEDDING_DIMENSIONS,
      normalize: true,
    }),
  });

  const response = await client.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  return responseBody.embedding;
}

export async function generateEmbeddings(credentials: Credentials, texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    const embedding = await generateEmbedding(credentials, text);
    results.push(embedding);
  }
  return results;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }

  // Vectors are pre-normalized by Titan Embed, so dot product = cosine similarity
  return dot;
}
