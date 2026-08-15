import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { chatRoute } from './routes/chat';
import { validateRoute } from './routes/validate';
import { modelsRoute } from './routes/models';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

app.get('/', (c) => {
  return c.json({ status: 'ok', service: 'RecallAI API' });
});

app.route('/api', chatRoute);
app.route('/api', validateRoute);
app.route('/api', modelsRoute);

export default app;
