import { Hono } from 'hono';
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import type { Credentials } from '../../../shared/types';
import { classifyError } from '../lib/bedrock';

export const modelsRoute = new Hono();

modelsRoute.post('/models', async (c) => {
  try {
    const body = await c.req.json<{ credentials: Credentials }>();

    if (!body.credentials?.accessKeyId || !body.credentials?.secretAccessKey || !body.credentials?.region) {
      return c.json({ success: false, error: 'Missing credentials.' }, 400);
    }

    const client = new BedrockClient({
      region: body.credentials.region,
      credentials: {
        accessKeyId: body.credentials.accessKeyId,
        secretAccessKey: body.credentials.secretAccessKey,
        ...(body.credentials.sessionToken && { sessionToken: body.credentials.sessionToken }),
      },
    });

    const command = new ListFoundationModelsCommand({});
    const response = await client.send(command);

    const models = (response.modelSummaries ?? [])
      .filter((m) => m.inferenceTypesSupported?.includes('ON_DEMAND'))
      .filter((m) => m.responseStreamingSupported)
      .map((m) => ({
        id: m.modelId ?? '',
        name: m.modelName ?? m.modelId ?? '',
        provider: m.providerName ?? '',
      }))
      .filter((m) => m.id)
      .sort((a, b) => a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name));

    return c.json({ success: true, models });
  } catch (err: any) {
    return c.json({ success: false, error: classifyError(err) }, 401);
  }
});
