import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';
import type { Credentials, ChatMessage } from '../../../shared/types';

export function createBedrockClient(credentials: Credentials): BedrockRuntimeClient {
  return new BedrockRuntimeClient({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
  });
}

export function formatMessages(messages: ChatMessage[]) {
  return messages.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: [{ text: msg.content }],
  }));
}

export async function validateCredentials(
  credentials: Credentials,
  modelId: string
): Promise<{ success: boolean; error?: string }> {
  const client = createBedrockClient(credentials);

  try {
    const command = new ConverseCommand({
      modelId,
      messages: [{ role: 'user', content: [{ text: 'Hi' }] }],
      inferenceConfig: { maxTokens: 1 },
    });

    await client.send(command);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: classifyError(err) };
  }
}

export async function* streamChat(
  credentials: Credentials,
  modelId: string,
  messages: ChatMessage[]
) {
  const client = createBedrockClient(credentials);

  const command = new ConverseStreamCommand({
    modelId,
    messages: formatMessages(messages),
    system: [{ text: 'You are RecallAI, a helpful and knowledgeable AI assistant. Provide clear, accurate, and well-structured responses.' }],
    inferenceConfig: {
      maxTokens: 4096,
      temperature: 0.7,
    },
  });

  const response = await client.send(command);

  if (!response.stream) {
    throw new Error('No stream in response');
  }

  for await (const event of response.stream) {
    if (event.contentBlockDelta?.delta?.text) {
      yield { type: 'delta' as const, text: event.contentBlockDelta.delta.text };
    }
    if (event.messageStop) {
      yield { type: 'done' as const };
    }
    if (event.metadata?.usage) {
      yield {
        type: 'done' as const,
        usage: {
          inputTokens: event.metadata.usage.inputTokens ?? 0,
          outputTokens: event.metadata.usage.outputTokens ?? 0,
        },
      };
    }
  }
}

function classifyError(err: any): string {
  const name = err.name || err.Code || '';
  const message = err.message || '';

  if (name === 'AccessDeniedException' || message.includes('not authorized')) {
    return 'Invalid credentials or insufficient permissions. Ensure your IAM user has bedrock:InvokeModel permission.';
  }
  if (name === 'ResourceNotFoundException' || message.includes('Could not resolve')) {
    return 'Model not available in the selected region. Try a different region or model.';
  }
  if (name === 'ThrottlingException' || message.includes('throttl')) {
    return 'Rate limit exceeded. Please wait a moment and try again.';
  }
  if (name === 'ValidationException') {
    return 'Invalid request. Please check your model selection.';
  }
  if (message.includes('fetch failed') || message.includes('ENOTFOUND')) {
    return 'Unable to reach Amazon Bedrock. Please check your region and network.';
  }

  return `Bedrock error: ${message || name || 'Unknown error'}`;
}

export { classifyError };
