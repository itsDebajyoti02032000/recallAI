import type { Credentials } from '../../../shared/types';

export interface JsonSchema {
  type: 'object';
  properties: Record<string, {
    type: string;
    description: string;
    enum?: string[];
    items?: { type: string };
    default?: unknown;
  }>;
  required?: string[];
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchema;
}

export interface ToolExecutionContext {
  db: D1Database;
  userId: string;
  credentials: Credentials;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export type ToolHandler = (
  input: Record<string, unknown>,
  context: ToolExecutionContext
) => Promise<ToolResult>;

export interface MCPServer {
  name: string;
  description: string;
  tools: MCPToolDefinition[];
  handlers: Record<string, ToolHandler>;
}
