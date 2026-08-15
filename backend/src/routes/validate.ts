import { Hono } from 'hono';
import { validateCredentials } from '../lib/bedrock';
import type { ValidateRequest } from '../../../shared/types';

export const validateRoute = new Hono();

validateRoute.post('/validate', async (c) => {
  try {
    const body = await c.req.json<ValidateRequest>();

    if (!body.credentials?.accessKeyId || !body.credentials?.secretAccessKey || !body.credentials?.region) {
      return c.json({ success: false, error: 'Missing required credentials fields.' }, 400);
    }

    if (!body.modelId) {
      return c.json({ success: false, error: 'Model ID is required.' }, 400);
    }

    const result = await validateCredentials(body.credentials, body.modelId);

    if (result.success) {
      return c.json({ success: true });
    } else {
      return c.json({ success: false, error: result.error }, 401);
    }
  } catch (err: any) {
    return c.json({ success: false, error: 'Validation failed. Please check your credentials.' }, 500);
  }
});
