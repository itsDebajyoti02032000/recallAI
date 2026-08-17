import type { ToolConfiguration } from '@aws-sdk/client-bedrock-runtime';
import type { MCPServer, ToolExecutionContext, ToolResult } from './types';
import { memoryServer } from './servers/memory';
import { webSearchServer } from './servers/web-search';

const servers: MCPServer[] = [memoryServer, webSearchServer];

export function getBedrockToolConfig(): ToolConfiguration {
  const tools = servers.flatMap((server) =>
    server.tools.map((tool) => ({
      toolSpec: {
        name: tool.name,
        description: tool.description,
        inputSchema: { json: tool.inputSchema },
      },
    }))
  ) as unknown as ToolConfiguration['tools'];

  return { tools, toolChoice: { auto: {} } };
}

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<ToolResult> {
  for (const server of servers) {
    if (server.handlers[toolName]) {
      try {
        return await server.handlers[toolName](input, context);
      } catch (err: any) {
        return { success: false, error: err.message || 'Tool execution failed' };
      }
    }
  }
  return { success: false, error: `Unknown tool: ${toolName}` };
}

export function getToolNames(): string[] {
  return servers.flatMap((s) => s.tools.map((t) => t.name));
}
