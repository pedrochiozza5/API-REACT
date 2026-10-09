import type { FastifyPluginAsync } from 'fastify';
import { pool } from '../db.js';

const PUBLIC_CACHE = 'public, max-age=30, stale-while-revalidate=120';
const DETAIL_CACHE = 'public, max-age=20, stale-while-revalidate=60';

function groupRows(rows:any[], key:string) {
  const grouped = new Map<number, any[]>();
  for (const row of rows) {
    const id = Number(row[key]);
    const list = grouped.get(id) || [];
    list.push(row);
    grouped.set(id, list);
  }
  return grouped;
}

async function enrichProductList(products:any[]) {
  if (!products.length) return products;

  const ids = products.map(product => Number(product.id));
  const placeholders = ids.map(() => '?').join(',');

  const [images, variants] = await Promise.all([
    pool.query<any[]>(
      `SELECT id, productId, imageUrl, altText, sortOrder
       FROM (
         SELECT id,
                product_id AS productId,
                image_url AS imageUrl,
                alt_text AS altText,
                sort_order AS sortOrder,
                ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY sort_order, id) AS mediaRank
         FROM product_images
         WHERE product_id IN (${placeholders})
       ) ranked
       WHERE mediaRank <= 2
       ORDER BY productId, sortOrder, id`,
      ids,
    ).then(([rows]) => rows),
    pool.query<any[]>(
      `SELECT id, product_id AS productId, name, value, color_hex AS colorHex, sku, price,
              compare_at_price AS compareAtPrice, stock_qty AS stockQty, track_stock AS trackStock,
              image_url AS imageUrl, image_zoom AS imageZoom, image_position_x AS imagePositionX,
              image_position_y AS imagePositionY, image_blend_mode AS imageBlendMode,
              active, sort_order AS sortOrder
       FROM product_variants
       WHERE product_id IN (${placeholders}) AND archived=0 AND active=1
       ORDER BY product_id, sort_order, id`,
      ids,
    ).then(([rows]) => rows),
  ]);

  const imagesByProduct = groupRows(images, 'productId');
  const variantsByProduct = groupRows(variants, 'productId');

  return products.map(product => {
    const productVariants = variantsByProduct.get(Number(product.id)) || [];
    const totalVariantStock = productVariants.reduce((sum, variant) => sum + Number(variant.stockQty || 0), 0);
    const variantPrices = productVariants
      .map(variant => Number(variant.price ?? product.price))
      .filter(Number.isFinite);

    // Cards only need one alternate product image. The detail endpoint returns all media.
    const alternateImages = (imagesByProduct.get(Number(product.id)) || [])
      .filter(image => image.imageUrl && image.imageUrl !== product.imageUrl)
      .slice(0, 1);

    return {
      ...product,
      stockQty: productVariants.length ? totalVariantStock : Number(product.stockQty),
      price: variantPrices.length ? Math.min(...variantPrices) : Number(product.price),
      hasVariants: productVariants.length > 0,
      variantCount: productVariants.length,
      variants: productVariants,
      images: alternateImages,
    };
  });
}

async function enrichProductDetail(products:any[]) {
  if (!products.length) return products;

  const ids = products.map(product => Number(product.id));
  const placeholders = ids.map(() => '?').join(',');

  const [images, variants] = await Promise.all([
    pool.query<any[]>(
      `SELECT id, product_id AS productId, image_url AS imageUrl, alt_text AS altText, sort_order AS sortOrder
       FROM product_images
       WHERE product_id IN (${placeholders})
       ORDER BY product_id, sort_order, id`,
      ids,
    ).then(([rows]) => rows),
    pool.query<any[]>(
      `SELECT id, product_id AS productId, name, value, color_hex AS colorHex, sku, price,
              compare_at_price AS compareAtPrice, wholesale_price AS wholesalePrice,
              stock_qty AS stockQty, low_stock_threshold AS lowStockThreshold,
              track_stock AS trackStock, image_url AS imageUrl, image_zoom AS imageZoom,
              image_position_x AS imagePositionX, image_position_y AS imagePositionY,
              image_blend_mode AS imageBlendMode, active, sort_order AS sortOrder
       FROM product_variants
       WHERE product_id IN (${placeholders}) AND archived=0
       ORDER BY product_id, sort_order, id`,
      ids,
    ).then(([rows]) => rows),
  ]);

  const variantIds = variants.map(variant => Number(variant.id));
  let variantImages:any[] = [];
  if (variantIds.length) {
    const placeholdersVariants = variantIds.map(() => '?').join(',');
    const [rows] = await pool.query<any[]>(
      `SELECT id, variant_id AS variantId, image_url AS imageUrl, alt_text AS altText, sort_order AS sortOrder
       FROM product_variant_images
       WHERE variant_id IN (${placeholdersVariants})
       ORDER BY variant_id, sort_order, id`,
      variantIds,
    );
    variantImages = rows;
  }

  const imagesByProduct = groupRows(images, 'productId');
  const imagesByVariant = groupRows(variantImages, 'variantId');
  const variantsByProduct = new Map<number, any[]>();

  for (const variant of variants) {
    variant.images = imagesByVariant.get(Number(variant.id)) || [];
    const id = Number(variant.productId);
    const list = variantsByProduct.get(id) || [];
    list.push(variant);
    variantsByProduct.set(id, list);
  }

  return products.map(product => {
    const allVariants = variantsByProduct.get(Number(product.id)) || [];
    const activeVariants = allVariants.filter(variant => Boolean(variant.active));
    const totalVariantStock = activeVariants.reduce((sum, variant) => sum + Number(variant.stockQty || 0), 0);
    const variantPrices = activeVariants
      .map(variant => Number(variant.price ?? product.price))
      .filter(Number.isFinite);

    return {
      ...product,
      stockQty: allVariants.length ? totalVariantStock : Number(product.stockQty),
      price: variantPrices.length ? Math.min(...variantPrices) : Number(product.price),
      hasVariants: allVariants.length > 0,
      variantCount: activeVariants.length,
      variants: activeVariants,
      images: imagesByProduct.get(Number(product.id)) || [],
    };
  });
}

export const catalogRoutes: FastifyPluginAsync = async app => {
  app.get('/api/brands', async (_request, reply) => {
    reply.header('Cache-Control', PUBLIC_CACHE);
    const [rows] = await pool.query('SELECT id, name, slug, accent, whatsapp, instagram, email FROM brands ORDER BY id');
    return rows;
  });

  app.get('/api/store-settings', async (_request, reply) => {
    reply.header('Cache-Control', PUBLIC_CACHE);
    const [rows] = await pool.query<any[]>(
      `SELECT setting_key AS settingKey, setting_value AS settingValue
       FROM site_settings
       WHERE setting_key IN ('hero_amargos','hero_enyerbados','shipping_note','pickup_note','store_status','announcement')`,
    );
    const settings = Object.fromEntries(rows.map(row => [row.settingKey, row.settingValue]));
    const [brands] = await pool.query<any[]>('SELECT id,name,whatsapp,instagram,email FROM brands ORDER BY id');
    return { settings, brands };
  });

  app.get('/api/categories', async (request, reply) => {
    reply.header('Cache-Control', PUBLIC_CACHE);
    const { brand } = request.query as { brand?: string };
    const params:unknown[] = [];
    let where = 'WHERE active = 1';
    if (brand) {
      where += ' AND brand_id = ?';
      params.push(brand);
    }
    const [rows] = await pool.query(
      `SELECT id, brand_id AS brandId, name, slug, image_url AS imageUrl, icon_key AS iconKey, sort_order AS sortOrder
       FROM categories ${where}
       ORDER BY sort_order, name`,
      params,
    );
    return rows;
  });

  app.get('/api/banners', async (request, reply) => {
    reply.header('Cache-Control', PUBLIC_CACHE);
    const { brand } = request.query as { brand?: string };
    const params:unknown[] = [];
    let where = 'WHERE active=1';
    if (brand) {
      where += ' AND (brand_id IS NULL OR brand_id=?)';
      params.push(brand);
    }
    const [rows] = await pool.query<any[]>(
      `SELECT id,brand_id AS brandId,eyebrow,title,subtitle,image_url AS imageUrl,
              mobile_image_url AS mobileImageUrl,object_position_desktop AS objectPositionDesktop,
              object_position_mobile AS objectPositionMobile,cta_label AS ctaLabel,href,sort_order AS sortOrder
       FROM home_banners
       ${where}
       ORDER BY sort_order,id
       LIMIT 10`,
      params,
    );
    return rows;
  });

  app.get('/api/faqs', async (_request, reply) => {
    reply.header('Cache-Control', PUBLIC_CACHE);
    const [rows] = await pool.query<any[]>(
      `SELECT id,question,answer,keywords,category,sort_order AS sortOrder,active
       FROM faq_items
       WHERE active=1
       ORDER BY sort_order,id
       LIMIT 100`,
    );
    return rows.map(row => ({ ...row, active: Boolean(row.active) }));
  });

  app.get('/api/products', async (request, reply) => {
    reply.header('Cache-Control', PUBLIC_CACHE);
    const query = request.query as {
      brand?: string;
      category?: string;
      featured?: string;
      collection?: string;
      q?: string;
      limit?: string;
    };

    const params:unknown[] = [];
    const conditions = ['p.active = 1'];

    if (query.brand) {
      conditions.push('p.brand_id = ?');
      params.push(query.brand);
    }
    if (query.category) {
      conditions.push('c.slug = ?');
      params.push(query.category);
    }
    if (query.featured === '1') conditions.push('p.featured = 1');
    if (query.collection === '1') conditions.push('p.collection_featured = 1');

    if (query.q?.trim()) {
      const term = `%${query.q.trim()}%`;
      conditions.push('(p.name LIKE ? OR p.sku LIKE ? OR c.name LIKE ?)');
      params.push(term, term, term);
    }

    const limit = Math.min(Math.max(Number(query.limit || 48), 1), 120);

    const [rows] = await pool.query<any[]>(
      `SELECT p.id, p.brand_id AS brandId, p.category_id AS categoryId, p.name, p.slug,
              p.short_description AS shortDescription, p.sku, p.price,
              p.compare_at_price AS compareAtPrice, p.stock_qty AS stockQty,
              p.track_stock AS trackStock, p.featured,
              p.collection_featured AS collectionFeatured, p.sort_order AS sortOrder,
              p.image_url AS imageUrl, p.image_zoom AS imageZoom,
              p.image_position_x AS imagePositionX, p.image_position_y AS imagePositionY,
              p.image_blend_mode AS imageBlendMode,
              c.name AS categoryName, c.slug AS categorySlug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY p.sort_order ASC, p.featured DESC, p.id DESC
       LIMIT ${limit}`,
      params,
    );

    return enrichProductList(rows);
  });

  app.get('/api/products/:slug', async (request, reply) => {
    reply.header('Cache-Control', DETAIL_CACHE);
    const { slug } = request.params as { slug: string };
    const [rows] = await pool.query<any[]>(
      `SELECT p.id, p.brand_id AS brandId, p.category_id AS categoryId, p.name, p.slug,
              p.short_description AS shortDescription, p.description,
              p.seo_title AS seoTitle, p.seo_description AS seoDescription,
              p.sku, p.price, p.compare_at_price AS compareAtPrice,
              p.wholesale_enabled AS wholesaleEnabled, p.wholesale_price AS wholesalePrice,
              p.wholesale_min_qty AS wholesaleMinQty,
              p.stock_qty AS stockQty, p.low_stock_threshold AS lowStockThreshold,
              p.track_stock AS trackStock, p.featured,
              p.collection_featured AS collectionFeatured, p.sort_order AS sortOrder,
              p.active, p.image_url AS imageUrl, p.image_zoom AS imageZoom,
              p.image_position_x AS imagePositionX, p.image_position_y AS imagePositionY,
              p.image_blend_mode AS imageBlendMode,
              c.name AS categoryName, c.slug AS categorySlug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ? AND p.active = 1
       LIMIT 1`,
      [slug],
    );

    if (!rows.length) return reply.code(404).send({ error: 'Producto no encontrado.' });
    const [product] = await enrichProductDetail(rows);
    return product;
  });
};
