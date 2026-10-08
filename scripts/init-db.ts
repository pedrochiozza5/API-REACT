import 'dotenv/config';
import mysql from 'mysql2/promise';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const schema = await readFile(path.resolve(process.cwd(), 'database/schema.sql'), 'utf8');
const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
  charset: 'utf8mb4',
});

await connection.query(schema);
await connection.end();
console.log('✓ Esquema creado/actualizado.');
