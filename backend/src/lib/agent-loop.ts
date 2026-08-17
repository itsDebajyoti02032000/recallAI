import { ConverseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
import type { Credentials, ChatMessage } from '../../../shared/types';
import { createBedrockClient, formatMessages } from './bedrock';
import { getBedrockToolConfig, executeTool } from '../mcp/registry';
import type { ToolExecutionContext } from '../mcp/types';

export interface AgentLoopConfig {
  credentials: Credentials;
  modelId: string;
  messages: ChatMessage[];
  systemPrompt: string;
  toolContext: ToolExecutionContext;
  maxIterations?: number;
}

export type AgentEvent =
  | { type: 'delta'; text: string }
  | { type: 'tool_start'; toolUseId: string; toolName: string; input: Record<string, unknown> }
  | { type: 'tool_result'; toolUseId: string; toolName: string; result: unknown; success: boolean }
  | { type: 'done'; usage?: { inputTokens: number; outputTokens: number } }
  | { type: 'error'; message: string };

export async function* runAgentLoop(config: AgentLoopConfig): AsyncGenerator<AgentEvent> {
  const client = createBedrockClient(config.credentials);
  const toolConfig = getBedrockToolConfig();
  const maxIterations = config.maxIterations ?? 10;

  let conversationMessages = formatMessages(config.messages);
  let totalUsage = { inputTokens: 0, outputTokens: 0 };

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const command = new ConverseStreamCommand({
      modelId: config.modelId,
      messages: conversationMessages,
      system: [{ text: config.systemPrompt }],
      toolConfig,
      inferenceConfig: { maxTokens: 4096, temperature: 0.7 },
    });

    let response;
    try {
      response = await client.send(command);
    } catch (err: any) {
      // If model doesn't support tools, fall back to no-tool call
      if (err.name === 'ValidationException' && err.message?.includes('tool')) {
        yield* runWithoutTools(client, config);
        return;
      }
      throw err;
    }

    if (!response.stream) {
      throw new Error('No stream in response');
    }

    const assistantContent: any[] = [];
    let currentToolUseId: string | null = null;
    let currentToolName: string | null = null;
    let toolInputJson = '';
    let stopReason: string | null = null;
    let currentTextBlock = '';

    for await (const event of response.stream) {
      if (event.contentBlockDelta?.delta?.text) {
        const text = event.contentBlockDelta.delta.text;
        currentTextBlock += text;
        yield { type: 'delta', text };
      }

      if (event.contentBlockStart?.start?.toolUse) {
        if (currentTextBlock) {
          assistantContent.push({ text: currentTextBlock });
          currentTextBlock = '';
        }
        const toolUse = event.contentBlockStart.start.toolUse;
        currentToolUseId = toolUse.toolUseId!;
        currentToolName = toolUse.name!;
        toolInputJson = '';
      }

      if (event.contentBlockDelta?.delta?.toolUse?.input) {
        toolInputJson += event.contentBlockDelta.delta.toolUse.input;
      }

      if (event.contentBlockStop !== undefined) {
        if (currentToolUseId && currentToolName) {
          const parsedInput = safeJsonParse(toolInputJson);
          assistantContent.push({
            toolUse: {
              toolUseId: currentToolUseId,
              name: currentToolName,
              input: parsedInput,
            },
          });
          currentToolUseId = null;
          currentToolName = null;
          toolInputJson = '';
        } else if (currentTextBlock) {
          assistantContent.push({ text: currentTextBlock });
          currentTextBlock = '';
        }
      }

      if (event.messageStop) {
        stopReason = event.messageStop.stopReason || null;
      }

      if (event.metadata?.usage) {
        totalUsage.inputTokens += event.metadata.usage.inputTokens ?? 0;
        totalUsage.outputTokens += event.metadata.usage.outputTokens ?? 0;
      }
    }

    if (currentTextBlock) {
      assistantContent.push({ text: currentTextBlock });
    }

    conversationMessages.push({ role: 'assistant', content: assistantContent });

    if (stopReason !== 'tool_use') {
      yield { type: 'done', usage: totalUsage };
      return;
    }

    // Execute requested tools
    const toolResults: any[] = [];
    for (const block of assistantContent) {
      if (block.toolUse) {
        const { toolUseId, name, input } = block.toolUse;

        yield { type: 'tool_start', toolUseId, toolName: name, input };

        const result = await executeTool(name, input, config.toolContext);

        yield {
          type: 'tool_result',
          toolUseId,
          toolName: name,
          result: result.data ?? result.error,
          success: result.success,
        };

        toolResults.push({
          toolResult: {
            toolUseId,
            content: [{ json: result.success ? (result.data ?? {}) : { error: result.error } }],
            status: result.success ? 'success' : 'error',
          },
        });
      }
    }

    conversationMessages.push({ role: 'user', content: toolResults });
  }

  yield { type: 'done', usage: totalUsage };
}

async function* runWithoutTools(
  client: ReturnType<typeof createBedrockClient>,
  config: AgentLoopConfig
): AsyncGenerator<AgentEvent> {
  const command = new ConverseStreamCommand({
    modelId: config.modelId,
    messages: formatMessages(config.messages),
    system: [{ text: config.systemPrompt }],
    inferenceConfig: { maxTokens: 4096, temperature: 0.7 },
  });

  const response = await client.send(command);
  if (!response.stream) throw new Error('No stream in response');

  for await (const event of response.stream) {
    if (event.contentBlockDelta?.delta?.text) {
      yield { type: 'delta', text: event.contentBlockDelta.delta.text };
    }
    if (event.metadata?.usage) {
      yield {
        type: 'done',
        usage: {
          inputTokens: event.metadata.usage.inputTokens ?? 0,
          outputTokens: event.metadata.usage.outputTokens ?? 0,
        },
      };
    }
    if (event.messageStop && !event.metadata) {
      yield { type: 'done' };
    }
  }
}

function safeJsonParse(json: string): Record<string, unknown> {
  try {
    return JSON.parse(json || '{}');
  } catch {
    return {};
  }
}
