import 'dotenv/config';
import { importMap } from '../server/routes/world.js';
import { pool } from '../server/db.js';
try {
  const result = await importMap();
  console.log('Materos por el Mundo');
  console.log(`Encontrados: ${result.found}`);
  console.log(`Importados: ${result.imported}`);
  console.log(`Actualizados: ${result.updated}`);
  console.log(`Ignorados: ${result.ignored}`);
  console.log(`Errores: ${result.errors}`);
} finally {
  await pool.end();
}
