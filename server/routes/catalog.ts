import type { FastifyPluginAsync } from 'fastify';
import { pool } from '../db.js';

async function enrichProducts(products: any[]) {
  if (!products.length) return products;
  const ids = products.map((p) => Number(p.id));
  const placeholders = ids.map(() => '?').join(',');
  const [images] = await pool.query<any[]>(
    `SELECT id, product_id AS productId, image_url AS imageUrl, alt_text AS altText, sort_order AS sortOrder
     FROM product_images WHERE product_id IN (${placeholders}) ORDER BY sort_order, id`,
    ids,
  );
  const [variants] = await pool.query<any[]>(
    `SELECT id, product_id AS productId, name, value, color_hex AS colorHex, sku, price,
            compare_at_price AS compareAtPrice, stock_qty AS stockQty, low_stock_threshold AS lowStockThreshold,
            track_stock AS trackStock, image_url AS imageUrl, image_zoom AS imageZoom,
            image_position_x AS imagePositionX, image_position_y AS imagePositionY, image_blend_mode AS imageBlendMode,
            active, sort_order AS sortOrder
     FROM product_variants WHERE product_id IN (${placeholders}) AND archived=0 ORDER BY sort_order, id`,
    ids,
  );
  const variantIds = variants.map((v) => Number(v.id));
  let variantImages: any[] = [];
  if (variantIds.length) {
    const vph = variantIds.map(() => '?').join(',');
    const [rows] = await pool.query<any[]>(
      `SELECT id, variant_id AS variantId, image_url AS imageUrl, alt_text AS altText, sort_order AS sortOrder
       FROM product_variant_images WHERE variant_id IN (${vph}) ORDER BY sort_order, id`,
      variantIds,
    );
    variantImages = rows;
  }

  const imagesByProduct = new Map<number, any[]>();
  for (const image of images) imagesByProduct.set(Number(image.productId), [...(imagesByProduct.get(Number(image.productId)) || []), image]);
  const imagesByVariant = new Map<number, any[]>();
  for (const image of variantImages) imagesByVariant.set(Number(image.variantId), [...(imagesByVariant.get(Number(image.variantId)) || []), image]);
  const variantsByProduct = new Map<number, any[]>();
  for (const variant of variants) {
    variant.images = imagesByVariant.get(Number(variant.id)) || [];
    variantsByProduct.set(Number(variant.productId), [...(variantsByProduct.get(Number(variant.productId)) || []), variant]);
  }

  return products.map((product) => {
    const allVariants = variantsByProduct.get(Number(product.id)) || [];
    const productVariants = allVariants.filter((v) => Boolean(v.active));
    const totalVariantStock = productVariants.reduce((sum, v) => sum + Number(v.stockQty || 0), 0);
    const variantPrices = productVariants.map((v) => Number(v.price ?? product.price)).filter(Number.isFinite);
    return {
      ...product,
      stockQty: allVariants.length ? totalVariantStock : Number(product.stockQty),
      price: variantPrices.length ? Math.min(...variantPrices) : Number(product.price),
      hasVariants: allVariants.length > 0,
      variantCount: productVariants.length,
      variants: productVariants,
      images: imagesByProduct.get(Number(product.id)) || [],
    };
  });
}

export const catalogRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/brands', async () => {
    const [rows] = await pool.query('SELECT id, name, slug, accent, whatsapp, instagram, email FROM brands ORDER BY id');
    return rows;
  });

  app.get('/api/store-settings', async () => {
    const [rows] = await pool.query<any[]>(`SELECT setting_key AS settingKey, setting_value AS settingValue FROM site_settings WHERE setting_key IN ('hero_amargos','hero_enyerbados','shipping_note','pickup_note','store_status','announcement')`);
    const settings = Object.fromEntries(rows.map((row) => [row.settingKey, row.settingValue]));
    const [brands] = await pool.query<any[]>('SELECT id,name,whatsapp,instagram,email FROM brands ORDER BY id');
    return { settings, brands };
  });

  app.get('/api/categories', async (request) => {
    const { brand } = request.query as { brand?: string };
    const params: unknown[] = [];
    let where = 'WHERE active = 1';
    if (brand) { where += ' AND brand_id = ?'; params.push(brand); }
    const [rows] = await pool.query(
      `SELECT id, brand_id AS brandId, name, slug, image_url AS imageUrl, icon_key AS iconKey, sort_order AS sortOrder
       FROM categories ${where} ORDER BY sort_order, name`, params,
    );
    return rows;
  });

  app.get('/api/banners', async (request) => {
    const { brand } = request.query as { brand?: string };
    const params: unknown[] = [];
    let where = 'WHERE active=1';
    if (brand) { where += ' AND (brand_id IS NULL OR brand_id=?)'; params.push(brand); }
    const [rows] = await pool.query<any[]>(
      `SELECT id,brand_id AS brandId,eyebrow,title,subtitle,image_url AS imageUrl,
              mobile_image_url AS mobileImageUrl,object_position_desktop AS objectPositionDesktop,
              object_position_mobile AS objectPositionMobile,cta_label AS ctaLabel,href,sort_order AS sortOrder
       FROM home_banners ${where} ORDER BY sort_order,id LIMIT 10`, params,
    );
    return rows;
  });

  app.get('/api/faqs', async () => {
    const [rows] = await pool.query<any[]>(
      `SELECT id,question,answer,keywords,category,sort_order AS sortOrder,active
       FROM faq_items WHERE active=1 ORDER BY sort_order,id LIMIT 100`,
    );
    return rows.map((row) => ({ ...row, active: Boolean(row.active) }));
  });

  app.get('/api/products', async (request) => {
    const query = request.query as { brand?: string; category?: string; featured?: string; collection?: string; q?: string; limit?: string };
    const params: unknown[] = [];
    const conditions = ['p.active = 1'];
    if (query.brand) { conditions.push('p.brand_id = ?'); params.push(query.brand); }
    if (query.category) { conditions.push('c.slug = ?'); params.push(query.category); }
    if (query.featured === '1') conditions.push('p.featured = 1');
    if (query.collection === '1') conditions.push('p.collection_featured = 1');
    if (query.q?.trim()) {
      conditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)');
      const term = `%${query.q.trim()}%`; params.push(term, term, term);
    }
    const limit = Math.min(Math.max(Number(query.limit || 80), 1), 120);
    const [rows] = await pool.query<any[]>(
      `SELECT p.id, p.brand_id AS brandId, p.category_id AS categoryId, p.name, p.slug,
              p.short_description AS shortDescription, p.description, p.seo_title AS seoTitle, p.seo_description AS seoDescription, p.sku, p.price,
              p.compare_at_price AS compareAtPrice, p.stock_qty AS stockQty,
              p.low_stock_threshold AS lowStockThreshold, p.track_stock AS trackStock,
              p.featured, p.collection_featured AS collectionFeatured, p.sort_order AS sortOrder,
              p.active, p.image_url AS imageUrl, p.image_zoom AS imageZoom, p.image_position_x AS imagePositionX,
              p.image_position_y AS imagePositionY, p.image_blend_mode AS imageBlendMode,
              c.name AS categoryName, c.slug AS categorySlug
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY p.sort_order ASC, p.featured DESC, p.id DESC LIMIT ${limit}`,
      params,
    );
    return enrichProducts(rows);
  });

  app.get('/api/products/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const [rows] = await pool.query<any[]>(
      `SELECT p.id, p.brand_id AS brandId, p.category_id AS categoryId, p.name, p.slug,
              p.short_description AS shortDescription, p.description, p.seo_title AS seoTitle, p.seo_description AS seoDescription, p.sku, p.price,
              p.compare_at_price AS compareAtPrice, p.stock_qty AS stockQty,
              p.low_stock_threshold AS lowStockThreshold, p.track_stock AS trackStock,
              p.featured, p.collection_featured AS collectionFeatured, p.sort_order AS sortOrder,
              p.active, p.image_url AS imageUrl, p.image_zoom AS imageZoom, p.image_position_x AS imagePositionX,
              p.image_position_y AS imagePositionY, p.image_blend_mode AS imageBlendMode,
              c.name AS categoryName, c.slug AS categorySlug
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ? AND p.active = 1 LIMIT 1`, [slug],
    );
    if (!rows.length) return reply.code(404).send({ error: 'Producto no encontrado.' });
    const [product] = await enrichProducts(rows);
    return product;
  });
};
