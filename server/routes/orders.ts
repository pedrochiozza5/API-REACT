import type { FastifyPluginAsync } from 'fastify';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { pool } from '../db.js';

const checkoutSchema = z.object({
  customerName: z.string().min(2).max(160),
  customerPhone: z.string().min(6).max(60),
  customerEmail: z.string().email().max(190).optional().or(z.literal('')),
  deliveryType: z.enum(['shipping', 'pickup']),
  address: z.string().max(500).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
  items: z.array(z.object({ productId: z.number().int().positive(), variantId: z.number().int().positive().optional(), qty: z.number().int().min(1).max(30) })).min(1).max(50),
});

function money(value: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
}

function makeWhatsappMessage(order: any, items: any[]) {
  const delivery = order.deliveryType === 'pickup'
    ? 'Retiro'
    : `Envío${order.address ? ` — ${order.address}` : ''}`;
  return [
    'Nombre:',
    order.customerName,
    '',
    'Entrega:',
    delivery,
    '',
    'Pedido:',
    ...items.map((i) => `${i.qty}x ${i.productName}${i.variantValue ? ` — ${i.variantValue}` : ''}`),
    '',
    'Total:',
    money(order.total),
  ].join('\n');
}

export async function restoreStockForOrder(orderId: number, reason: 'cancel_restore' | 'expire_restore', actorAdminId: number | null = null) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [orders] = await conn.query<any[]>('SELECT id, status FROM orders WHERE id = ? FOR UPDATE', [orderId]);
    if (!orders.length) throw new Error('Pedido inexistente');
    if (['cancelled', 'expired'].includes(orders[0].status)) { await conn.rollback(); return false; }

    const [items] = await conn.query<any[]>(
      `SELECT product_id AS productId, variant_id AS variantId, SUM(qty) AS qty
       FROM order_items WHERE order_id = ? AND product_id IS NOT NULL GROUP BY product_id, variant_id`, [orderId],
    );

    for (const item of items) {
      if (item.variantId) {
        const [variants] = await conn.query<any[]>('SELECT id, stock_qty AS stockQty, track_stock AS trackStock FROM product_variants WHERE id=? AND product_id=? FOR UPDATE', [item.variantId, item.productId]);
        const variant = variants[0];
        if (!variant || !variant.trackStock) continue;
        const next = Number(variant.stockQty) + Number(item.qty);
        await conn.query('UPDATE product_variants SET stock_qty=? WHERE id=?', [next, item.variantId]);
        await conn.query(`INSERT INTO stock_movements (product_id, variant_id, order_id, delta, balance_after, reason, note, actor_admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [item.productId, item.variantId, orderId, Number(item.qty), next, reason, reason === 'expire_restore' ? 'Reserva vencida' : 'Pedido cancelado', actorAdminId]);
      } else {
        const [products] = await conn.query<any[]>('SELECT id, stock_qty AS stockQty, track_stock AS trackStock FROM products WHERE id=? FOR UPDATE', [item.productId]);
        const product = products[0];
        if (!product || !product.trackStock) continue;
        const next = Number(product.stockQty) + Number(item.qty);
        await conn.query('UPDATE products SET stock_qty=? WHERE id=?', [next, item.productId]);
        await conn.query(`INSERT INTO stock_movements (product_id, order_id, delta, balance_after, reason, note, actor_admin_id) VALUES (?, ?, ?, ?, ?, ?, ?)`, [item.productId, orderId, Number(item.qty), next, reason, reason === 'expire_restore' ? 'Reserva vencida' : 'Pedido cancelado', actorAdminId]);
      }
    }

    await conn.query('UPDATE orders SET status=? WHERE id=?', [reason === 'expire_restore' ? 'expired' : 'cancelled', orderId]);
    await conn.commit();
    return true;
  } catch (error) { await conn.rollback(); throw error; } finally { conn.release(); }
}

export const orderRoutes: FastifyPluginAsync = async (app) => {
  app.post('/api/orders', async (request, reply) => {
    const parsed = checkoutSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Revisá los datos del pedido.', details: parsed.error.flatten() });
    const input = parsed.data;
    if (input.deliveryType === 'shipping' && !input.address?.trim()) return reply.code(400).send({ error: 'Ingresá una dirección para el envío.' });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[storeSetting]] = await conn.query<any[]>("SELECT setting_value AS value FROM site_settings WHERE setting_key='store_status' LIMIT 1");
      if (storeSetting?.value === 'closed') {
        await conn.rollback();
        return reply.code(409).send({ error: 'La tienda está pausada por el momento. Podés volver a intentar más tarde.' });
      }
      const [[reservationSetting]] = await conn.query<any[]>("SELECT setting_value AS value FROM site_settings WHERE setting_key='reservation_minutes' LIMIT 1");
      const reservationMinutes = Math.max(Number(reservationSetting?.value || process.env.STOCK_RESERVATION_MINUTES || 30), 5);
      const code = `RND-${new Date().toISOString().slice(2,10).replaceAll('-','')}-${nanoid(5).toUpperCase()}`;
      const reservedUntil = new Date(Date.now() + reservationMinutes * 60_000);
      const [insertOrder] = await conn.query<any>(`INSERT INTO orders (code, customer_name, customer_phone, customer_email, delivery_type, address, notes, reserved_until) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [code, input.customerName, input.customerPhone, input.customerEmail || null, input.deliveryType, input.address || null, input.notes || null, reservedUntil]);
      const orderId = Number(insertOrder.insertId);
      await conn.query('INSERT INTO order_events (order_id,from_status,to_status,note) VALUES (?,NULL,?,?)',[orderId,'pending','Pedido creado']);
      let subtotal = 0;
      const finalItems: any[] = [];

      for (const item of input.items) {
        const [products] = await conn.query<any[]>(`SELECT id, brand_id AS brandId, name, sku, price, stock_qty AS stockQty, track_stock AS trackStock, active, image_url AS imageUrl FROM products WHERE id=? FOR UPDATE`, [item.productId]);
        const product = products[0];
        if (!product || !product.active) throw new Error('Uno de los productos ya no está disponible.');
        const [[variantCount]] = await conn.query<any[]>('SELECT COUNT(*) AS total FROM product_variants WHERE product_id=? AND archived=0', [product.id]);

        let variant: any = null;
        if (Number(variantCount.total) > 0) {
          if (!item.variantId) throw new Error(`Elegí una variante de ${product.name}.`);
          const [variants] = await conn.query<any[]>(`SELECT id, name, value, sku, price, stock_qty AS stockQty, track_stock AS trackStock, active, image_url AS imageUrl FROM product_variants WHERE id=? AND product_id=? AND archived=0 FOR UPDATE`, [item.variantId, product.id]);
          variant = variants[0];
          if (!variant || !variant.active) throw new Error(`La variante elegida de ${product.name} ya no está disponible.`);
          if (variant.trackStock && Number(variant.stockQty) < item.qty) throw new Error(`No hay stock suficiente de ${product.name} · ${variant.value}. Disponible: ${variant.stockQty}.`);
        } else if (product.trackStock && Number(product.stockQty) < item.qty) {
          throw new Error(`No hay stock suficiente de ${product.name}. Disponible: ${product.stockQty}.`);
        }

        const unitPrice = Number(variant?.price ?? product.price);
        const lineTotal = unitPrice * item.qty;
        const imageUrl = variant?.imageUrl || product.imageUrl || null;
        subtotal += lineTotal;
        finalItems.push({ productName: product.name, brandId: product.brandId, variantValue: variant?.value || null, qty: item.qty, lineTotal });
        await conn.query(
          `INSERT INTO order_items (order_id, product_id, variant_id, brand_id, product_name, sku, variant_name, variant_value, variant_sku, image_url, unit_price, qty, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [orderId, product.id, variant?.id || null, product.brandId, product.name, product.sku, variant?.name || null, variant?.value || null, variant?.sku || null, imageUrl, unitPrice, item.qty, lineTotal],
        );

        if (variant?.trackStock) {
          const next = Number(variant.stockQty) - item.qty;
          if (next < 0) throw new Error(`No hay stock suficiente de ${product.name} · ${variant.value}.`);
          await conn.query('UPDATE product_variants SET stock_qty=? WHERE id=?', [next, variant.id]);
          await conn.query(`INSERT INTO stock_movements (product_id, variant_id, order_id, delta, balance_after, reason, note) VALUES (?, ?, ?, ?, ?, 'sale_reservation', 'Reserva automática al crear pedido')`, [product.id, variant.id, orderId, -item.qty, next]);
        } else if (!variant && product.trackStock) {
          const next = Number(product.stockQty) - item.qty;
          if (next < 0) throw new Error(`No hay stock suficiente de ${product.name}.`);
          await conn.query('UPDATE products SET stock_qty=? WHERE id=?', [next, product.id]);
          await conn.query(`INSERT INTO stock_movements (product_id, order_id, delta, balance_after, reason, note) VALUES (?, ?, ?, ?, 'sale_reservation', 'Reserva automática al crear pedido')`, [product.id, orderId, -item.qty, next]);
        }
      }

      const shippingCost = 0; const total = subtotal + shippingCost;
      await conn.query('UPDATE orders SET subtotal=?, shipping_cost=?, total=? WHERE id=?', [subtotal, shippingCost, total, orderId]);
      // Resolve WhatsApp settings before committing: an error after COMMIT must never
      // appear to the buyer as a failed order, otherwise a retry can duplicate it.
      const [[whatsappSetting]] = await conn.query<any[]>("SELECT setting_value AS value FROM site_settings WHERE setting_key='order_whatsapp' LIMIT 1");
      const phone = String(whatsappSetting?.value || process.env.ORDER_WHATSAPP || '5492257410476').replace(/\D/g, '');
      if (phone.length < 8 || phone.length > 15) throw new Error('El número de WhatsApp de la tienda no está configurado correctamente.');
      const order = { id: orderId, code, customerName: input.customerName, customerPhone: input.customerPhone, deliveryType: input.deliveryType, address: input.address, notes: input.notes, total, reservedUntil };
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(makeWhatsappMessage(order, finalItems))}`;
      await conn.commit();
      return reply.code(201).send({ order, whatsappUrl });
    } catch (error: any) {
      await conn.rollback();
      return reply.code(409).send({ error: error?.message || 'No se pudo crear el pedido.' });
    } finally { conn.release(); }
  });
};
