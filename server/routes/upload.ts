import type { FastifyPluginAsync } from 'fastify';
import type { ResultSetHeader } from 'mysql2';
import { createWriteStream, promises as fs } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { requirePermission } from '../auth.js';
import { pool } from '../db.js';
import { getUploadRoot } from '../uploads.js';

const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const extByMime: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
};

type Dimensions = { width: number | null; height: number | null };
function readImageDimensions(buffer: Buffer, mime: string): Dimensions {
  try {
    if (mime === 'image/png' && buffer.length >= 24 && buffer.toString('ascii', 1, 4) === 'PNG') {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }
    if (mime === 'image/jpeg' && buffer[0] === 0xff && buffer[1] === 0xd8) {
      const sof = new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
      let offset = 2;
      while (offset + 9 < buffer.length) {
        if (buffer[offset] !== 0xff) { offset++; continue; }
        const marker = buffer[offset + 1];
        if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue; }
        const length = buffer.readUInt16BE(offset + 2);
        if (sof.has(marker) && offset + 8 < buffer.length) {
          return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
        }
        if (length < 2) break;
        offset += 2 + length;
      }
    }
    if (mime === 'image/webp' && buffer.length >= 30 && buffer.toString('ascii',0,4)==='RIFF' && buffer.toString('ascii',8,12)==='WEBP') {
      const kind = buffer.toString('ascii',12,16);
      if (kind === 'VP8X' && buffer.length >= 30) {
        const width = 1 + buffer[24] + (buffer[25] << 8) + (buffer[26] << 16);
        const height = 1 + buffer[27] + (buffer[28] << 8) + (buffer[29] << 16);
        return { width, height };
      }
      if (kind === 'VP8L' && buffer.length >= 25 && buffer[20] === 0x2f) {
        const b1=buffer[21], b2=buffer[22], b3=buffer[23], b4=buffer[24];
        return { width: 1 + (((b2 & 0x3f) << 8) | b1), height: 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6)) };
      }
      if (kind === 'VP8 ') {
        const sig = Buffer.from([0x9d,0x01,0x2a]);
        const pos = buffer.indexOf(sig, 20);
        if (pos >= 0 && pos + 7 < buffer.length) return { width: buffer.readUInt16LE(pos+3)&0x3fff, height: buffer.readUInt16LE(pos+5)&0x3fff };
      }
    }
  } catch { /* metadata is helpful, never required for a valid upload */ }
  return { width: null, height: null };
}


function matchesMime(buffer: Buffer, mime: string) {
  if (mime === 'image/png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  if (mime === 'image/jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === 'image/webp') return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  if (mime === 'image/avif') {
    if (buffer.length < 16 || buffer.toString('ascii', 4, 8) !== 'ftyp') return false;
    const brands = buffer.toString('ascii', 8, Math.min(buffer.length, 32));
    return brands.includes('avif') || brands.includes('avis');
  }
  return false;
}

export const uploadRoutes: FastifyPluginAsync = async (app) => {
  app.post('/api/admin/upload', { preHandler: requirePermission('media.manage') }, async (request, reply) => {
    const file = await request.file({ limits: { fileSize: 8 * 1024 * 1024, files: 1 } });
    if (!file || !allowed.has(file.mimetype)) return reply.code(400).send({ error: 'Subí una imagen JPG, PNG, WEBP o AVIF.' });
    const uploadDir = getUploadRoot();
    await fs.mkdir(uploadDir, { recursive: true });
    const filename = `${Date.now()}-${nanoid(8)}${extByMime[file.mimetype]}`;
    const diskPath = path.join(uploadDir, filename);
    try {
      await pipeline(file.file, createWriteStream(diskPath));
      if (file.file.truncated) {
        await fs.unlink(diskPath).catch(() => undefined);
        return reply.code(413).send({ error: 'La imagen supera el máximo de 8 MB.' });
      }
      const [stat, bytes] = await Promise.all([fs.stat(diskPath), fs.readFile(diskPath)]);
      if (!matchesMime(bytes, file.mimetype)) {
        await fs.unlink(diskPath).catch(() => undefined);
        return reply.code(400).send({ error: 'El archivo no coincide con un formato de imagen válido.' });
      }
      const { width, height } = readImageDimensions(bytes, file.mimetype);
      const url = `/uploads/${filename}`;
      try {
        const [r] = await pool.query<ResultSetHeader>(
          'INSERT INTO media_assets (url,file_name,mime_type,size_bytes,width,height,uploaded_by) VALUES (?,?,?,?,?,?,?)',
          [url, filename, file.mimetype, stat.size, width, height, request.user.id],
        );
        return { id: Number(r.insertId || 0), url, fileName: filename, width, height, sizeBytes: stat.size, mimeType: file.mimetype };
      } catch (error) {
        await fs.unlink(diskPath).catch(() => undefined);
        throw error;
      }
    } catch (error: any) {
      await fs.unlink(diskPath).catch(() => undefined);
      request.log.error({ err: error }, 'admin image upload failed');
      return reply.code(500).send({ error: 'No se pudo guardar la imagen.' });
    }
  });
};
