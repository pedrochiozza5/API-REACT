import 'dotenv/config';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { catalogRoutes } from './routes/catalog.js';
import { orderRoutes } from './routes/orders.js';
import { adminRoutes } from './routes/admin.js';
import { uploadRoutes } from './routes/upload.js';
import { cronRoutes } from './routes/cron.js';
import { worldRoutes } from './routes/world.js';
import { dbHealth, ensureV9Schema } from './db.js';
import { renderSeoDocument, seoRoutes } from './seo.js';
import { getLegacyUploadRoot, getUploadRoot } from './uploads.js';

async function legacyUploadRoots(primaryLegacyRoot: string) {
  const roots = new Set<string>([primaryLegacyRoot]);
  if (process.env.NODE_ENV !== 'production') return [...roots];

  // Hostinger conserva releases anteriores dentro de ~/hbuilds/versions.
  // Si una versión vieja guardó imágenes dentro del release, las recuperamos
  // de forma no destructiva hacia el directorio persistente.
  const home = process.env.HOME?.trim();
  if (!home) return [...roots];

  const hbuilds = path.join(home, 'hbuilds');
  roots.add(path.join(hbuilds, 'current', 'uploads'));
  roots.add(path.join(hbuilds, 'last-source', 'uploads'));

  try {
    const versionsRoot = path.join(hbuilds, 'versions');
    const versions = await fs.readdir(versionsRoot, { withFileTypes: true });
    for (const version of versions) {
      if (version.isDirectory()) roots.add(path.join(versionsRoot, version.name, 'uploads'));
    }
  } catch (error: any) {
    if (error?.code !== 'ENOENT') throw error;
  }

  return [...roots];
}

async function migrateLegacyUploads(legacyRoots: string[], persistentRoot: string, log: { info: (...args: any[]) => void; warn: (...args: any[]) => void }) {
  await fs.mkdir(persistentRoot, { recursive: true });
  let copied = 0;

  for (const legacyRoot of legacyRoots) {
    if (path.resolve(legacyRoot) === path.resolve(persistentRoot)) continue;
    try {
      const entries = await fs.readdir(legacyRoot, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const source = path.join(legacyRoot, entry.name);
        const target = path.join(persistentRoot, entry.name);
        try {
          await fs.access(target);
        } catch {
          await fs.copyFile(source, target);
          copied++;
        }
      }
    } catch (error: any) {
      if (error?.code !== 'ENOENT') log.warn({ err: error, legacyRoot }, 'no se pudieron revisar uploads heredados');
    }
  }

  if (copied) log.info({ copied }, 'uploads heredados recuperados al almacenamiento persistente');
}

async function start() {
  const app = Fastify({ logger: true, trustProxy: true });

  await app.register(cookie);
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-only-change-me',
    cookie: { cookieName: 'ba_admin', signed: false },
  });
  await app.register(multipart, { limits: { fileSize: 8 * 1024 * 1024, files: 8 } });
  await app.register(rateLimit, { global: false, max: 120, timeWindow: '1 minute' });

  await ensureV9Schema();

  // Resolve runtime paths from this compiled file instead of relying on cwd.
  // Hostinger starts Node through its own LiteSpeed wrapper, so cwd is not
  // guaranteed to be the project directory.
  const currentFile = fileURLToPath(import.meta.url);
  const serverDir = path.dirname(currentFile);
  const projectRoot = path.resolve(serverDir, '..');
  const uploadRoot = getUploadRoot();
  const legacyUploadRoot = getLegacyUploadRoot();
  const clientRoot = path.join(projectRoot, 'dist', 'client');

  // @fastify/static requires the root to exist. Empty directories can be
  // dropped by deployment pipelines, so recreate it at runtime if needed.
  await fs.mkdir(uploadRoot, { recursive: true });
  await migrateLegacyUploads(await legacyUploadRoots(legacyUploadRoot), uploadRoot, app.log);

  await app.register(fastifyStatic, {
    root: uploadRoot,
    prefix: '/uploads/',
    decorateReply: false,
    cacheControl: true,
    maxAge: '30d',
    immutable: true,
  });

  await app.register(catalogRoutes);
  await app.register(orderRoutes);
  await app.register(adminRoutes);
  await app.register(uploadRoutes);
  await app.register(cronRoutes);
  await app.register(worldRoutes);
  await app.register(seoRoutes);

  app.get('/api/health', async (_request, reply) => {
    try {
      await dbHealth();
      return { ok: true, db: true, version: '9.0.0', time: new Date().toISOString() };
    } catch (error: any) {
      return reply.code(503).send({ ok: false, db: false, error: error.message });
    }
  });

  try {
    await fs.access(clientRoot);
    await app.register(fastifyStatic, {
      root: clientRoot,
      prefix: '/',
      wildcard: false,
      index: false,
      cacheControl: true,
      maxAge: '30d',
    });

    app.setNotFoundHandler(async (request, reply) => {
      if (request.method === 'GET' && request.headers.accept?.includes('text/html')) {
        const requestUrl=request.raw.url||request.url;
        const parsed=new URL(requestUrl,'https://bienamargos.com.ar');
        if(parsed.pathname==='/enyerbados')return reply.redirect('/yerbados',301);
        if(parsed.pathname==='/tienda')return reply.redirect('/catalogo',301);
        if(parsed.pathname==='/colecciones'||(parsed.pathname==='/catalogo'&&parsed.searchParams.get('collection')==='1')){
          const brand=parsed.searchParams.get('brand');
          return reply.redirect(brand==='enyerbados'?'/catalogo?brand=enyerbados':'/catalogo',301);
        }
        const template=await fs.readFile(path.join(clientRoot,'index.html'),'utf8');
        const rendered=await renderSeoDocument(template,requestUrl);
        if(rendered.seo.robots.includes('noindex'))reply.header('X-Robots-Tag',rendered.seo.robots);
        return reply.type('text/html; charset=utf-8').header('Cache-Control',parsed.pathname.startsWith('/producto/')?'public, max-age=120':'public, max-age=300').send(rendered.html);
      }
      return reply.code(404).send({ error: 'Ruta no encontrada.' });
    });
  } catch {
    app.log.warn({ clientRoot }, 'dist/client no existe: ejecutá npm run build para producción.');
  }

  const port = Number(process.env.PORT || 3000);
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info({ port, projectRoot }, 'Bien Amargos V9 API iniciada.');
}

// IMPORTANT for Hostinger/LiteSpeed:
// Do not use top-level await in the entry module graph. Hostinger loads
// server.js with require(), and Node 22 rejects require() of an ESM graph
// containing top-level await (ERR_REQUIRE_ASYNC_MODULE).
start().catch((error) => {
  console.error('FATAL_STARTUP_ERROR', error);
  process.exitCode = 1;
});
