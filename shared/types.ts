export interface Credentials {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
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
  type: 'delta' | 'done' | 'error' | 'memory_context' | 'tool_start' | 'tool_result';
  text?: string;
  message?: string;
  memoryIds?: string[];
  memoryCount?: number;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  toolUseId?: string;
  toolName?: string;
  input?: Record<string, unknown>;
  result?: unknown;
  success?: boolean;
}

export interface ToolCall {
  toolUseId: string;
  toolName: string;
  status: 'running' | 'completed' | 'error';
  input?: Record<string, unknown>;
  result?: unknown;
  startedAt: number;
  completedAt?: number;
}

// Memory System Types

export type MemoryType = 'fact' | 'preference' | 'episodic';

export interface Memory {
  id: string;
  userId: string;
  type: MemoryType;
  content: string;
  importance: number;
  sourceConversationId?: string;
  sourceMessageId?: string;
  createdAt: string;
  updatedAt: string;
  accessedAt: string;
  accessCount: number;
}

export interface MemoryListRequest {
  credentials: Credentials;
  type?: MemoryType;
  limit?: number;
  offset?: number;
}

export interface MemoryListResponse {
  success: boolean;
  memories: Memory[];
  total: number;
  error?: string;
}

export interface MemorySearchRequest {
  credentials: Credentials;
  query: string;
  limit?: number;
}

export interface MemorySearchResponse {
  success: boolean;
  memories: (Memory & { similarity: number })[];
  error?: string;
}

export interface MemoryUpdateRequest {
  credentials: Credentials;
  memoryId: string;
  content?: string;
  importance?: number;
  type?: MemoryType;
}

export interface MemoryDeleteRequest {
  credentials: Credentials;
  memoryId: string;
}

export interface MemoryStatsResponse {
  success: boolean;
  total: number;
  facts: number;
  preferences: number;
  episodic: number;
}
