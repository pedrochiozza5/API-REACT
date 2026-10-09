import mysql from 'mysql2/promise';
import 'dotenv/config';

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 12,
  maxIdle: 8,
  idleTimeout: 60_000,
  queueLimit: 0,
  decimalNumbers: true,
  charset: 'utf8mb4',
});

export async function dbHealth() {
  const [rows] = await pool.query('SELECT 1 AS ok');
  return rows;
}

export async function ensureV9Schema() {
  // Runtime migration is idempotent and additive only.
  const hasColumn = async (table:'products'|'product_variants', column:string) => {
    const [rows] = await pool.query<any[]>(
      `SELECT 1 ok
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?
       LIMIT 1`,
      [table,column],
    );
    return rows.length > 0;
  };

  const hasIndex = async (table:string, indexName:string) => {
    const [rows] = await pool.query<any[]>(
      `SELECT 1 ok
       FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND INDEX_NAME=?
       LIMIT 1`,
      [table,indexName],
    );
    return rows.length > 0;
  };

  if (!(await hasColumn('products','wholesale_enabled'))) {
    await pool.query('ALTER TABLE products ADD COLUMN wholesale_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER compare_at_price');
  }
  if (!(await hasColumn('products','wholesale_price'))) {
    await pool.query('ALTER TABLE products ADD COLUMN wholesale_price DECIMAL(12,2) NULL AFTER wholesale_enabled');
  }
  if (!(await hasColumn('products','wholesale_min_qty'))) {
    await pool.query('ALTER TABLE products ADD COLUMN wholesale_min_qty INT NOT NULL DEFAULT 6 AFTER wholesale_price');
  }
  if (!(await hasColumn('product_variants','wholesale_price'))) {
    await pool.query('ALTER TABLE product_variants ADD COLUMN wholesale_price DECIMAL(12,2) NULL AFTER compare_at_price');
  }

  const indexes:Array<[string,string,string]> = [
    ['products','idx_products_storefront','active, brand_id, sort_order, id'],
    ['products','idx_products_featured','active, featured, sort_order, id'],
    ['product_images','idx_product_images_product_sort','product_id, sort_order, id'],
    ['product_variants','idx_product_variants_storefront','product_id, archived, active, sort_order, id'],
    ['product_variant_images','idx_variant_images_variant_sort','variant_id, sort_order, id'],
    ['categories','idx_categories_storefront','active, brand_id, sort_order, id'],
  ];

  for (const [table,indexName,columns] of indexes) {
    if (!(await hasIndex(table,indexName))) {
      await pool.query(`ALTER TABLE \`${table}\` ADD INDEX \`${indexName}\` (${columns})`);
    }
  }
}
