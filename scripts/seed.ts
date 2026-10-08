import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from '../server/db.js';

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== '1') {
  throw new Error('db:seed está bloqueado en producción para proteger productos, stock, pedidos e imágenes existentes. Usá ALLOW_DEMO_SEED=1 solo si realmente querés cargar datos demo.');
}

async function upsertBrand(id: string, name: string, slug: string, accent: string, whatsapp: string, instagram: string, email: string) {
  await pool.query(
    `INSERT INTO brands (id, name, slug, accent, whatsapp, instagram, email)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE id=id`,
    [id, name, slug, accent, whatsapp, instagram, email],
  );
}

await upsertBrand('amargos', 'Bien Amargos', 'bien-amargos', '#174D35', '5492257410476', '@bien.amargos', 'bienamargos@gmail.com');
await upsertBrand('enyerbados', 'Bien Yerbados', 'bien-yerbados', '#d7c6ad', '5492257410476', '@Enyerbate.ok', 'Enyerbate.ok@gmail.com');
// V7 source-of-truth: preserve the internal id `enyerbados` for compatibility,
// but migrate the public brand name/slug to Bien Yerbados and keep one WhatsApp.
await pool.query("UPDATE brands SET name='Bien Yerbados', slug='bien-yerbados', accent='#d7c6ad', whatsapp='5492257410476' WHERE id='enyerbados'");
await pool.query("UPDATE brands SET whatsapp='5492257410476' WHERE id='amargos'");

const categories = [
  ['amargos', 'Mates', 'mates', 10],
  ['amargos', 'Bombillas', 'bombillas', 20],
  ['amargos', 'Termos', 'termos', 30],
  ['amargos', 'Canastas', 'canastas', 40],
  ['amargos', 'Combos', 'combos', 50],
  ['amargos', 'Accesorios', 'accesorios', 60],
  ['enyerbados', 'Yerbas', 'yerbas', 10],
  ['enyerbados', 'Yerberos', 'yerberos', 20],
  ['enyerbados', 'Dispensers', 'dispensers', 30],
] as const;

for (const [brand, name, slug, sort] of categories) {
  await pool.query(
    `INSERT INTO categories (brand_id, name, slug, sort_order) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE id=id`,
    [brand, name, slug, sort],
  );
}

const [catRows] = await pool.query<any[]>('SELECT id, brand_id AS brandId, slug FROM categories');
const cat = new Map(catRows.map((c) => [`${c.brandId}:${c.slug}`, c.id]));

const products = [
  ['amargos','mates','Mate Scaloneta','mate-scaloneta','BA-MAT-001',35000,8,true,'Un mate con identidad argentina, pensado para la ronda de todos los días.'],
  ['amargos','combos','Combo Imperial','combo-imperial','BA-COM-001',54500,5,true,'Combo listo para regalar o arrancar una ronda completa.'],
  ['amargos','combos','Combo Completo','combo-completo','BA-COM-002',56000,5,true,'Mate, bombilla y accesorios combinados en una sola propuesta.'],
  ['amargos','mates','Mate Indio','mate-indio','BA-MAT-002',30000,7,true,'Terminación clásica y personalidad marcada.'],
  ['amargos','mates','Mate Maradona','mate-maradona','BA-MAT-003',30000,6,true,'Un homenaje futbolero para acompañar cada cebada.'],
  ['amargos','bombillas','Bombillón de alpaca semi recto','bombillon-alpaca-semi-recto','BA-BOM-001',23000,9,true,'Bombillón robusto de alpaca, cómodo y durable.'],
  ['amargos','bombillas','Bombillón de alpaca','bombillon-alpaca','BA-BOM-002',25000,0,false,'Modelo de alpaca de gran caudal.'],
  ['amargos','mates','Imperial de calabaza liso','imperial-calabaza-liso','BA-MAT-004',30000,4,true,'Imperial de calabaza con estética limpia y terminación tradicional.'],
  ['enyerbados','yerbas','Rei Verde Premium 1 KG','rei-verde-premium-1kg','BY-YER-001',12000,14,true,'Yerba seleccionada de perfil intenso y duradero.'],
  ['enyerbados','yerbas','Canarias Té Verde y Jengibre 1 KG','canarias-te-verde-jengibre-1kg','BY-YER-002',13000,10,true,'Canarias con notas frescas de té verde y jengibre.'],
  ['enyerbados','yerbas','Canarias Serena 1 KG','canarias-serena-1kg','BY-YER-003',13000,12,true,'Una versión más suave y equilibrada para mate largo.'],
  ['enyerbados','yerbas','Canarias Especial 1 KG','canarias-especial-1kg','BY-YER-004',13000,11,true,'Perfil clásico e intenso, seleccionado para quienes buscan carácter.'],
  ['enyerbados','yerbas','Baldo 1 KG','baldo-1kg','BY-YER-005',11500,13,true,'Yerba uruguaya de molienda fina y sabor sostenido.'],
  ['enyerbados','yerbas','Canarias Tradicional 1 KG','canarias-tradicional-1kg','BY-YER-006',13000,12,true,'La clásica Canarias, intensa y rendidora.'],
  ['enyerbados','yerberos','Yerbero de 1/4 KG','yerbero-cuarto-kilo','BY-YEB-001',10000,8,true,'Contenedor práctico para llevar tu yerba protegida.'],
] as const;

for (const [brand, categorySlug, name, slug, sku, price, stock, featured, description] of products) {
  await pool.query(
    `INSERT INTO products (brand_id, category_id, name, slug, short_description, description, sku, price, stock_qty, low_stock_threshold, track_stock, featured, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 3, 1, ?, 1)
     ON DUPLICATE KEY UPDATE id=id`,
    [brand, cat.get(`${brand}:${categorySlug}`) || null, name, slug, description, description, sku, price, stock, featured ? 1 : 0],
  );
}

// Assets reales provistos por Bien Amargos. Se aplican solo cuando el producto no tiene imagen propia.
// Así un redeploy nunca pisa una foto subida luego desde el panel.
const seededAssets: Array<{ sku: string; primary: string; gallery?: string[] }> = [
  { sku: 'BA-MAT-001', primary: '/catalog/products/mate-scaloneta.webp' },
  { sku: 'BA-COM-001', primary: '/catalog/products/combo-imperial.webp' },
  { sku: 'BA-COM-002', primary: '/catalog/products/combo-completo.webp', gallery: ['/catalog/products/combo-completo-1.webp','/catalog/products/combo-completo-2.webp','/catalog/products/combo-completo-3.webp'] },
  { sku: 'BA-MAT-002', primary: '/catalog/products/mate-indio.webp' },
  { sku: 'BA-MAT-003', primary: '/catalog/products/mate-maradona.webp' },
  { sku: 'BA-BOM-001', primary: '/catalog/products/bombillon-pico-bronce.webp' },
  { sku: 'BA-BOM-002', primary: '/catalog/products/bombillon-alpaca.webp' },
  { sku: 'BA-MAT-004', primary: '/catalog/products/imperial-calabaza.webp' },
];

for (const asset of seededAssets) {
  const [pRows] = await pool.query<any[]>('SELECT id, image_url AS imageUrl FROM products WHERE sku=? LIMIT 1', [asset.sku]);
  const row = pRows[0];
  if (!row) continue;
  if (!row.imageUrl) await pool.query('UPDATE products SET image_url=? WHERE id=? AND (image_url IS NULL OR image_url=\'\')', [asset.primary, row.id]);
  if (asset.gallery?.length) {
    const [galleryCount] = await pool.query<any[]>('SELECT COUNT(*) AS total FROM product_images WHERE product_id=?', [row.id]);
    if (Number(galleryCount[0]?.total || 0) === 0) {
      for (const [index, imageUrl] of asset.gallery.entries()) {
        await pool.query('INSERT INTO product_images (product_id,image_url,alt_text,sort_order) VALUES (?,?,?,?)', [row.id, imageUrl, null, index]);
      }
    }
  }
}

// Biblioteca adicional: si más adelante importás productos del catálogo anterior con estos slugs,
// la foto real se vincula automáticamente sin crear productos ni tocar precios/stock.
const optionalAssetBySlug: Record<string, string> = {
  'canasta-matera-premium': '/catalog/products/canasta-premium.webp',
  'canasta-matera-premium-negro': '/catalog/products/canasta-premium-negro.webp',
  'canasta-matera-premium-marron': '/catalog/products/canasta-premium-marron.webp',
  'canasta-matera-premium-borravino': '/catalog/products/canasta-premium-bordo.webp',
  'termo-media-manija': '/catalog/products/termo-media-manija.webp',
  'bombilla-pico-de-loro-larga': '/catalog/products/bombilla-larga.webp',
  'bombilla-pico-de-loro-corta': '/catalog/products/bombilla-corta.webp',
  'bombilla-pico-de-loro-acero': '/catalog/products/bombilla-acero.webp',
  'imperial-de-algarrobo': '/catalog/products/imperial-algarrobo.webp',
  'torpedo-de-calabaza-cincelado': '/catalog/products/torpedo-calabaza.webp',
  'torpedo-de-calabaza-cincelado-negro': '/catalog/products/torpedo-calabaza-negro.webp',
  'torpedo-de-calabaza-cincelado-borravino': '/catalog/products/torpedo-calabaza-bordo.webp',
};
for (const [slug, imageUrl] of Object.entries(optionalAssetBySlug)) {
  await pool.query('UPDATE products SET image_url=? WHERE slug=? AND (image_url IS NULL OR image_url=\'\')', [imageUrl, slug]);
}

// Variantes demo V4. Solo se crean cuando el producto todavía no tiene variantes.
const demoVariants = [
  ['BA-MAT-004', 'Color', 'Negro', '#171914', 'BA-MAT-004-NEG', 1],
  ['BA-MAT-004', 'Color', 'Verde oliva', '#596447', 'BA-MAT-004-OLI', 1],
  ['BA-MAT-004', 'Color', 'Suela', '#9a6b3f', 'BA-MAT-004-SUE', 1],
  ['BA-MAT-004', 'Color', 'Bordó', '#6c2931', 'BA-MAT-004-BOR', 1],
  ['BA-MAT-002', 'Color', 'Negro', '#1d1d1b', 'BA-MAT-002-NEG', 3],
  ['BA-MAT-002', 'Color', 'Marrón', '#704c35', 'BA-MAT-002-MAR', 2],
  ['BA-MAT-002', 'Color', 'Verde', '#334d3d', 'BA-MAT-002-VER', 2],
] as const;
for (const [productSku, name, value, color, variantSku, stock] of demoVariants) {
  const [pRows] = await pool.query<any[]>('SELECT id FROM products WHERE sku=? LIMIT 1', [productSku]);
  const productId = pRows[0]?.id;
  if (!productId) continue;
  const [existing] = await pool.query<any[]>('SELECT COUNT(*) AS total FROM product_variants WHERE product_id=?', [productId]);
  if (Number(existing[0]?.total || 0) === 0 || (await pool.query<any[]>('SELECT id FROM product_variants WHERE sku=? LIMIT 1', [variantSku]))[0].length === 0) {
    await pool.query(
      `INSERT INTO product_variants (product_id,name,value,color_hex,sku,stock_qty,low_stock_threshold,track_stock,active,sort_order)
       VALUES (?,?,?,?,?,?,2,1,1,?) ON DUPLICATE KEY UPDATE id=id`,
      [productId, name, value, color, variantSku, stock, demoVariants.findIndex((x) => x[4] === variantSku)],
    );
  }
}

const seededVariantAssets: Record<string, string> = {
  'BA-MAT-004-NEG': '/catalog/products/imperial-calabaza-negro.webp',
  'BA-MAT-004-BOR': '/catalog/products/imperial-calabaza-bordo.webp',
  'BA-MAT-004-SUE': '/catalog/products/imperial-calabaza.webp',
};
for (const [variantSku, imageUrl] of Object.entries(seededVariantAssets)) {
  await pool.query('UPDATE product_variants SET image_url=? WHERE sku=? AND (image_url IS NULL OR image_url=\'\')', [imageUrl, variantSku]);
}

const email = (process.env.ADMIN_EMAIL || 'admin@bienamargos.com.ar').toLowerCase();
const password = process.env.ADMIN_PASSWORD || 'Cambiar-Esta-Clave-Ya-2026!';
const hash = await bcrypt.hash(password, 12);
await pool.query(
  `INSERT INTO admins (name, email, password_hash, role, active)
   VALUES (?, ?, ?, 'superadmin', 1)
   ON DUPLICATE KEY UPDATE id=id`,
  [process.env.ADMIN_NAME || 'Administrador', email, hash],
);

const defaultSettings: Array<[string,string]> = [
  ['hero_image','/brand/hero-beach.webp'],
  ['hero_amargos','Tu próxima ronda empieza acá.'],
  ['hero_enyerbados','Yerba con presencia.'],
  ['announcement','Envíos a todo el país · Retiro coordinado'],
  ['store_status','open'],
  ['reservation_minutes',process.env.STOCK_RESERVATION_MINUTES || '30'],
  ['order_whatsapp',process.env.ORDER_WHATSAPP || '5492257410476'],
  ['shipping_note','Coordinamos costo y correo según destino.'],
  ['pickup_note','Retiro coordinado en Mar de Ajó.'],
];
for (const [key,value] of defaultSettings) {
  await pool.query(
    'INSERT INTO site_settings (setting_key,setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_key=setting_key',
    [key,value],
  );
}
await pool.query("INSERT INTO site_settings (setting_key,setting_value) VALUES ('order_whatsapp','5492257410476') ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)");


// V6.1 — carrusel editorial. Se crea una sola vez; luego se administra desde Ronda Admin.
const [[bannerCount]] = await pool.query<any[]>('SELECT COUNT(*) AS total FROM home_banners');
if (Number(bannerCount?.total || 0) === 0) {
  const banners = [
    [null, 'Bien Amargos', 'La ronda, afuera.', 'Productos reales. Momentos reales.', '/brand/chicos.webp', 'Ver catálogo', '/catalogo', 10],
    [null, 'Colección', 'Todo para tu ronda.', 'Mates, termos, bombillas y combos.', '/brand/repisa.webp', 'Explorar', '/catalogo?brand=amargos', 20],
    [null, 'Bien Yerbados', 'La yerba también elige.', 'Una selección para acompañar cada mate.', '/brand/yerbas-stock.webp', 'Ver Yerbados', '/yerbados', 30],
  ];
  for (const b of banners) await pool.query(
    `INSERT INTO home_banners (brand_id,eyebrow,title,subtitle,image_url,cta_label,href,sort_order,active) VALUES (?,?,?,?,?,?,?,?,1)`, b,
  );
}

// V7 — FAQ base para Cana. Solo se inserta si la tabla está vacía; luego se administra desde Ronda Admin.
const [[faqCount]] = await pool.query<any[]>('SELECT COUNT(*) AS total FROM faq_items');
if (Number(faqCount?.total || 0) === 0) {
  const faqs = [
    ['¿Hacen envíos?', 'Realizamos envíos a todo el país por correo.', 'envio,enviar,envios,correo,despacho', 'Envíos', 10],
    ['¿Puedo retirar?', 'Podés retirar gratis en puntos de entrega coordinados en Mar de Ajó.', 'retiro,retirar,buscar,mar de ajo', 'Retiros', 20],
    ['¿Qué medios de pago aceptan?', 'Aceptamos transferencia bancaria y efectivo.', 'pago,pagar,transferencia,efectivo', 'Pagos', 30],
    ['¿Cómo compro?', 'Elegí tus productos, revisá el carrito y finalizá el pedido. Después se abre WhatsApp para confirmar.', 'comprar,compra,como comprar,pedido,carrito', 'Cómo comprar', 40],
    ['¿Puedo comprar de las dos marcas?', 'Sí. Bien Amargos y Bien Yerbados comparten un único carrito y un único pedido.', 'bien amargos,bien yerbados,dos marcas,mismo carrito', 'Bien Yerbados', 50],
    ['¿Cómo veo el stock?', 'El stock disponible se muestra en cada producto y variante. Si una variante figura agotada, no se puede agregar al carrito.', 'stock,disponible,agotado,variante', 'Stock', 60],
  ];
  for (const faq of faqs) await pool.query(
    'INSERT INTO faq_items (question,answer,keywords,category,sort_order,active) VALUES (?,?,?,?,?,1)',
    faq,
  );
}


// V8 — FAQs de Materos por el Mundo. Idempotentes y sin inventar ubicaciones.
const mapFaqs = [
  ['¿Qué es Materos por el Mundo?', 'Es el mapa de lugares que forman parte de la comunidad de Bien Amargos.', 'materos por el mundo,mapa,ronda,comunidad', 'Materos por el Mundo', 70],
  ['¿Cómo sumo mi ciudad?', 'Podés escribirnos por WhatsApp para proponernos tu ciudad. Los puntos se publican después de revisarlos.', 'sumar ciudad,agregar ciudad,mapa,punto', 'Materos por el Mundo', 80],
];
for (const faq of mapFaqs) {
  const [exists] = await pool.query<any[]>('SELECT id FROM faq_items WHERE question=? LIMIT 1', [faq[0]]);
  if (!exists.length) await pool.query('INSERT INTO faq_items (question,answer,keywords,category,sort_order,active) VALUES (?,?,?,?,?,1)', faq);
}

console.log('✓ Datos iniciales listos.');
console.log(`✓ Admin: ${email}`);
if (!process.env.ADMIN_PASSWORD) console.log('⚠ Usaste la clave demo del .env.example. Cambiala antes de publicar.');
await pool.end();
