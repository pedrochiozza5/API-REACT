import type { FastifyPluginAsync } from 'fastify';
import { pool } from '../db.js';
import { restoreStockForOrder } from './orders.js';

export const cronRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/cron/release-stock', async (request, reply) => {
    const query = request.query as { secret?: string };
    if (!process.env.CRON_SECRET || query.secret !== process.env.CRON_SECRET) {
      return reply.code(401).send({ error: 'No autorizado.' });
    }
    const [orders] = await pool.query<any[]>(
      `SELECT id FROM orders WHERE status='pending' AND reserved_until IS NOT NULL AND reserved_until < NOW() LIMIT 100`,
    );
    let released = 0;
    for (const order of orders) {
      if (await restoreStockForOrder(Number(order.id), 'expire_restore')) released += 1;
    }
    return { ok: true, released };
  });
};
