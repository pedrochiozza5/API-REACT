import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

export function getLegacyUploadRoot() {
  const currentFile = fileURLToPath(import.meta.url);
  const serverDir = path.dirname(currentFile);
  const projectRoot = path.resolve(serverDir, '..');
  return path.join(projectRoot, 'uploads');
}

export function getUploadRoot() {
  const configured = process.env.UPLOAD_DIR?.trim();
  if (configured) return path.resolve(configured);

  // En producción los releases de Hostinger pueden reemplazarse en cada deploy.
  // Usar HOME mantiene las imágenes fuera del release actual y evita perderlas.
  if (process.env.NODE_ENV === 'production') {
    const home = process.env.HOME?.trim() || os.homedir();
    if (home) return path.join(path.resolve(home), '.bienamargos', 'uploads');
  }

  return getLegacyUploadRoot();
}
