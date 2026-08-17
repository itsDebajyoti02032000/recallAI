import { Hono } from 'hono';
import { classifyError } from '../lib/bedrock';
import { hashAccessKeyId } from '../lib/user-identity';
import { buildSystemPrompt } from '../lib/system-prompt';
import { extractAndStoreMemories } from '../lib/memory-pipeline';
import { runAgentLoop } from '../lib/agent-loop';
import type { ToolExecutionContext } from '../mcp/types';
import type { Env } from '../types/env';
import type { ChatRequest } from '../../../shared/types';

export const chatRoute = new Hono<{ Bindings: Env }>();

chatRoute.post('/chat', async (c) => {
  try {
    const body = await c.req.json<ChatRequest & { conversationId?: string }>();

    if (!body.credentials?.accessKeyId || !body.credentials?.secretAccessKey || !body.credentials?.region) {
      return c.json({ error: 'Missing credentials.' }, 400);
    }

    if (!body.modelId) {
      return c.json({ error: 'Model ID is required.' }, 400);
    }

    if (!body.messages || body.messages.length === 0) {
      return c.json({ error: 'Messages array is required.' }, 400);
    }

    const userId = await hashAccessKeyId(body.credentials.accessKeyId);
    const systemPrompt = buildSystemPrompt(null);
    const encoder = new TextEncoder();
    let fullResponse = '';

    const toolContext: ToolExecutionContext = {
      db: c.env.DB,
      userId,
      credentials: body.credentials,
    };

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of runAgentLoop({
            credentials: body.credentials,
            modelId: body.modelId,
            messages: body.messages,
            systemPrompt,
            toolContext,
          })) {
            if (event.type === 'delta') {
              fullResponse += event.text;
            }
            const chunk = JSON.stringify(event);
            controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
          }
        } catch (err: any) {
          const errorEvent = JSON.stringify({
            type: 'error',
            message: classifyError(err),
          });
          controller.enqueue(encoder.encode(`data: ${errorEvent}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    c.executionCtx.waitUntil(
      extractAndStoreMemories(
        c.env.DB,
        body.credentials,
        body.modelId,
        body.messages,
        userId,
        body.conversationId || 'unknown'
      )
    );

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: any) {
    return c.json({ error: 'Invalid request body.' }, 400);
  }
});
