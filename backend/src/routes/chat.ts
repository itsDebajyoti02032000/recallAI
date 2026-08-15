import { Hono } from 'hono';
import { streamChat, classifyError } from '../lib/bedrock';
import type { ChatRequest } from '../../../shared/types';

export const chatRoute = new Hono();

chatRoute.post('/chat', async (c) => {
  try {
    const body = await c.req.json<ChatRequest>();

    if (!body.credentials?.accessKeyId || !body.credentials?.secretAccessKey || !body.credentials?.region) {
      return c.json({ error: 'Missing credentials.' }, 400);
    }

    if (!body.modelId) {
      return c.json({ error: 'Model ID is required.' }, 400);
    }

    if (!body.messages || body.messages.length === 0) {
      return c.json({ error: 'Messages array is required.' }, 400);
    }

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of streamChat(body.credentials, body.modelId, body.messages)) {
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
