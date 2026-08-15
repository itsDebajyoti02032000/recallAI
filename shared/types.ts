export interface Credentials {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  credentials: Credentials;
  modelId: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface ValidateRequest {
  credentials: Credentials;
  modelId: string;
}

export interface ValidateResponse {
  success: boolean;
  error?: string;
}

export interface StreamEvent {
  type: 'delta' | 'done' | 'error';
  text?: string;
  message?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}
