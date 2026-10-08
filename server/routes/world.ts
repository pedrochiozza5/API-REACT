import type { FastifyPluginAsync } from 'fastify';
import type { ResultSetHeader } from 'mysql2';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { pool } from '../db.js';
import { canAccessBrand, requirePermission } from '../auth.js';

const MAP_ID = '1H7jBVTMTyRzpcZ4r8ycmM6yWTgofOHY';
const KML_URL = `https://www.google.com/maps/d/kml?mid=${MAP_ID}&forcekml=1`;

const locationSchema = z.object({
  name: z.string().min(1).max(190),
  city: z.string().max(160).nullable().optional(),
  province: z.string().max(160).nullable().optional(),
  country: z.string().max(160).nullable().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  description: z.string().max(4000).nullable().optional(),
  imageUrl: z.string().max(500).nullable().optional(),
  brandId: z.enum(['amargos','enyerbados']).nullable().optional(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999999).default(0),
});

async function auditWorld(request:any,action:string,entityId?:string|number|null,detail?:unknown){
  try{await pool.query('INSERT INTO audit_logs (admin_id,action,entity_type,entity_id,detail_json,ip_address) VALUES (?,?,?,?,?,?)',[request.user?.id||null,action,'matero_location',entityId==null?null:String(entityId),detail?JSON.stringify(detail):null,request.ip||null]);}catch{}
}

function decodeXml(input:string){
  return input.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
}
function cleanDescription(input:string){
  return decodeXml(input || '').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,'').replace(/(?:\+?\d[\d\s().-]{7,}\d)/g,'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim().slice(0,4000);
}
function firstTag(xml:string, tag:string){
  const m=xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,'i'));
  return m ? decodeXml(m[1]).trim() : '';
}
function parseKml(kml:string){
  const placemarks=[...kml.matchAll(/<Placemark(?:\s[^>]*)?>([\s\S]*?)<\/Placemark>/gi)];
  const out:any[]=[];
  placemarks.forEach((m,index)=>{
    const block=m[1];
    const coords=firstTag(block,'coordinates').trim().split(/\s+/)[0]?.split(',').map(Number);
    if(!coords || coords.length<2 || !Number.isFinite(coords[0]) || !Number.isFinite(coords[1])) return;
    const name=(firstTag(block,'name') || `Matero ${index+1}`).slice(0,190);
    const description=cleanDescription(firstTag(block,'description'));
    const longitude=coords[0], latitude=coords[1];
    const fingerprint=createHash('sha1').update(`${name}|${latitude.toFixed(6)}|${longitude.toFixed(6)}`).digest('hex');
    const externalId=`placemark-${fingerprint}`;
    out.push({name,description:description||null,latitude,longitude,externalId,fingerprint});
  });
  return out;
}

async function importMap(){
  const response=await fetch(KML_URL,{headers:{'user-agent':'BienAmargos/8.0 map importer'}});
  if(!response.ok) throw new Error(`Google My Maps respondió HTTP ${response.status}.`);
  const body=await response.text();
  if(body.startsWith('PK')) throw new Error('La exportación llegó como KMZ. Volvé a intentar con forcekml=1.');
  const parsed=parseKml(body);
  let imported=0,updated=0,ignored=0,errors=0;
  for(const point of parsed){
    try{
      const [rows]=await pool.query<any[]>('SELECT id FROM materos_locations WHERE (source=? AND source_external_id=?) OR source_fingerprint=? LIMIT 1',['google_my_maps',point.externalId,point.fingerprint]);
      if(rows.length){
        await pool.query('UPDATE materos_locations SET name=?,latitude=?,longitude=?,description=?,source_external_id=?,source_fingerprint=? WHERE id=?',[point.name,point.latitude,point.longitude,point.description,point.externalId,point.fingerprint,rows[0].id]);
        updated++;
      }else{
        await pool.query('INSERT INTO materos_locations (name,latitude,longitude,description,source,source_external_id,source_fingerprint,active,sort_order) VALUES (?,?,?,?,\'google_my_maps\',?,?,1,?)',[point.name,point.latitude,point.longitude,point.description,point.externalId,point.fingerprint,imported*10]);
        imported++;
      }
    }catch{errors++;}
  }
  if(!parsed.length) ignored=1;
  return {found:parsed.length,imported,updated,ignored,errors,mapId:MAP_ID};
}

export const worldRoutes:FastifyPluginAsync=async(app)=>{
  app.get('/api/world-maters',async()=>{
    const [locations]=await pool.query<any[]>(`SELECT id,name,city,province,country,latitude,longitude,description,image_url AS imageUrl,brand_id AS brandId,featured,sort_order AS sortOrder FROM materos_locations WHERE active=1 ORDER BY featured DESC,sort_order ASC,id ASC`);
    const safe=locations.map(r=>({...r,latitude:Number(r.latitude),longitude:Number(r.longitude),featured:Boolean(r.featured)}));
    const cities=new Set(safe.map((r:any)=>[r.city,r.province,r.country].filter(Boolean).join('|')).filter(Boolean));
    const provinces=new Set(safe.map((r:any)=>r.province).filter(Boolean));
    const countries=new Set(safe.map((r:any)=>r.country).filter(Boolean));
    return {locations:safe,stats:{locations:safe.length,cities:cities.size,provinces:provinces.size,countries:countries.size}};
  });

  app.get('/api/admin/world-maters',{preHandler:requirePermission('materos.manage')},async()=>{
    const [rows]=await pool.query<any[]>(`SELECT id,name,city,province,country,latitude,longitude,description,image_url AS imageUrl,brand_id AS brandId,source,source_external_id AS sourceExternalId,featured,active,sort_order AS sortOrder,created_at AS createdAt,updated_at AS updatedAt FROM materos_locations ORDER BY sort_order,id`);
    return rows.map(r=>({...r,latitude:Number(r.latitude),longitude:Number(r.longitude),featured:Boolean(r.featured),active:Boolean(r.active)}));
  });

  app.get('/api/admin/world-maters/geocode',{preHandler:requirePermission('materos.manage'),config:{rateLimit:{max:20,timeWindow:'1 minute'}}},async(request,reply)=>{
    const query=String((request.query as any).q||'').trim(); if(query.length<3)return reply.code(400).send({error:'Escribí al menos 3 caracteres.'});
    try{
      const url=`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`;
      const response=await fetch(url,{headers:{'user-agent':'BienAmargos/8.0 (admin geocoder)'}}); if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const data:any[]=await response.json(); return data.map(x=>({name:x.display_name,latitude:Number(x.lat),longitude:Number(x.lon),type:x.type||null})).filter(x=>Number.isFinite(x.latitude)&&Number.isFinite(x.longitude));
    }catch{return reply.code(502).send({error:'No se pudo consultar el geocodificador ahora.'});}
  });

  app.post('/api/admin/world-maters',{preHandler:requirePermission('materos.manage')},async(request,reply)=>{
    const parsed=locationSchema.safeParse(request.body); if(!parsed.success)return reply.code(400).send({error:'Ubicación inválida.'}); const x=parsed.data;
    if(x.brandId&&!canAccessBrand(request,x.brandId))return reply.code(403).send({error:'Sin acceso a esta marca.'});
    const fingerprint=createHash('sha1').update(`${x.name}|${x.latitude.toFixed(6)}|${x.longitude.toFixed(6)}|admin`).digest('hex');
    const [r]=await pool.query<ResultSetHeader>(`INSERT INTO materos_locations (name,city,province,country,latitude,longitude,description,image_url,brand_id,source,source_fingerprint,featured,active,sort_order) VALUES (?,?,?,?,?,?,?,?,?,'admin',?,?,?,?)`,[x.name,x.city||null,x.province||null,x.country||null,x.latitude,x.longitude,x.description||null,x.imageUrl||null,x.brandId||null,fingerprint,x.featured?1:0,x.active?1:0,x.sortOrder]);
    await auditWorld(request,'world_mater.create',r.insertId,{name:x.name}); return reply.code(201).send({ok:true,id:Number(r.insertId)});
  });
  app.put('/api/admin/world-maters/:id',{preHandler:requirePermission('materos.manage')},async(request,reply)=>{
    const id=Number((request.params as any).id); const parsed=locationSchema.safeParse(request.body); if(!parsed.success)return reply.code(400).send({error:'Ubicación inválida.'}); const x=parsed.data;
    const [old]=await pool.query<any[]>('SELECT brand_id AS brandId FROM materos_locations WHERE id=? LIMIT 1',[id]); if(!old.length)return reply.code(404).send({error:'Ubicación inexistente.'});
    if((old[0].brandId&&!canAccessBrand(request,old[0].brandId))||(x.brandId&&!canAccessBrand(request,x.brandId)))return reply.code(403).send({error:'Sin acceso a esta marca.'});
    await pool.query(`UPDATE materos_locations SET name=?,city=?,province=?,country=?,latitude=?,longitude=?,description=?,image_url=?,brand_id=?,featured=?,active=?,sort_order=? WHERE id=?`,[x.name,x.city||null,x.province||null,x.country||null,x.latitude,x.longitude,x.description||null,x.imageUrl||null,x.brandId||null,x.featured?1:0,x.active?1:0,x.sortOrder,id]);
    await auditWorld(request,'world_mater.update',id,{name:x.name}); return {ok:true};
  });
  app.delete('/api/admin/world-maters/:id',{preHandler:requirePermission('materos.manage')},async(request)=>{const id=Number((request.params as any).id);await pool.query('DELETE FROM materos_locations WHERE id=?',[id]);await auditWorld(request,'world_mater.delete',id);return{ok:true};});
  app.post('/api/admin/world-maters/import',{preHandler:requirePermission('materos.manage'),config:{rateLimit:{max:3,timeWindow:'10 minutes'}}},async(request,reply)=>{try{const result=await importMap();await auditWorld(request,'world_mater.import',null,result);return result;}catch(error:any){return reply.code(502).send({error:error.message||'No se pudo importar el mapa.'});}});
};

export { importMap, MAP_ID, KML_URL };
