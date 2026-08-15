import type { StreamEvent, ValidateRequest, ValidateResponse } from '@recallai/shared';

const API_BASE = '';

export async function validateCredentials(request: ValidateRequest): Promise<ValidateResponse> {
  const response = await fetch(`${API_BASE}/api/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  return response.json();
}

export async function* streamChat(
  messages: { id: string; role: string; content: string }[],
  credentials: { region: string; accessKeyId: string; secretAccessKey: string },
  modelId: string,
  signal: AbortSignal
): AsyncGenerator<StreamEvent> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, credentials, modelId }),
    signal,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const data: StreamEvent = JSON.parse(line.slice(6));
        yield data;
      } catch {}
    }
  }
}
