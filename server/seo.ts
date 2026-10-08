import type { FastifyPluginAsync } from 'fastify';
import { pool } from './db.js';

const BASE_URL=(process.env.PUBLIC_URL||'https://bienamargos.com.ar').replace(/\/+$/,'');

const HTML_ENTITIES:Record<string,string>={'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'};
const XML_ENTITIES:Record<string,string>={'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','\"':'&quot;'};
function htmlEscape(value:string){return value.replace(/[&<>\"]/g,(char)=>HTML_ENTITIES[char]||char);}
function xmlEscape(value:string){return value.replace(/[<>&'\"]/g,(char)=>XML_ENTITIES[char]||char);}
function absoluteUrl(value?:string|null){if(!value)return `${BASE_URL}/brand/bien-amargos-mark.png`;try{return new URL(value,`${BASE_URL}/`).toString();}catch{return `${BASE_URL}/brand/bien-amargos-mark.png`;}}
function cleanText(value?:string|null,max=165){const text=String(value||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();if(text.length<=max)return text;return `${text.slice(0,max-1).trimEnd()}…`;}
function jsonLd(value:unknown){return JSON.stringify(value).replace(/</g,'\\u003c');}
function setTag(html:string,matcher:RegExp,replacement:string){return matcher.test(html)?html.replace(matcher,replacement):html.replace('</head>',`  ${replacement}\n</head>`);}

type SeoData={title:string;description:string;canonical:string;image:string;type:'website'|'product';robots:string;jsonLd?:unknown[]};

async function productSeo(slug:string):Promise<SeoData|null>{
  const [rows]=await pool.query<any[]>(`SELECT p.id,p.brand_id AS brandId,p.name,p.slug,p.short_description AS shortDescription,p.description,p.seo_title AS seoTitle,p.seo_description AS seoDescription,p.sku,p.price,p.stock_qty AS stockQty,p.track_stock AS trackStock,p.image_url AS imageUrl,c.name AS categoryName,c.slug AS categorySlug FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.slug=? AND p.active=1 LIMIT 1`,[slug]);
  if(!rows.length)return null;
  const p=rows[0];
  const [gallery]=await pool.query<any[]>('SELECT image_url AS imageUrl FROM product_images WHERE product_id=? ORDER BY sort_order,id LIMIT 12',[p.id]);
  const [variants]=await pool.query<any[]>(`SELECT id,name,value,color_hex AS colorHex,sku,price,stock_qty AS stockQty,track_stock AS trackStock,image_url AS imageUrl FROM product_variants WHERE product_id=? AND active=1 AND archived=0 ORDER BY sort_order,id LIMIT 40`,[p.id]);
  const brandName=p.brandId==='enyerbados'?'Bien Yerbados':'Bien Amargos';
  const canonical=`${BASE_URL}/producto/${encodeURIComponent(p.slug)}`;
  const images=[p.imageUrl,...gallery.map(x=>x.imageUrl),...variants.map(x=>x.imageUrl)].filter(Boolean).map((value)=>absoluteUrl(String(value))).filter((v,i,a)=>a.indexOf(v)===i);
  const description=cleanText(p.seoDescription||p.shortDescription||p.description||`${p.name} en ${brandName}.`);
  const title=cleanText(p.seoTitle||`${p.name} | ${brandName}`,70);
  const brand={ '@type':'Brand',name:brandName };
  const offerFor=(price:number,stock:number,track:boolean,url=canonical)=>({
    '@type':'Offer',url,priceCurrency:'ARS',price:Number(price),availability:!track||stock>0?'https://schema.org/InStock':'https://schema.org/OutOfStock',seller:{'@type':'Organization',name:'Bien Amargos'}
  });
  let productMarkup:any;
  if(variants.length){
    const firstName=String(variants[0]?.name||'').toLowerCase();
    const variesBy=firstName.includes('color')?'https://schema.org/color':firstName.includes('tama')||firstName.includes('size')?'https://schema.org/size':undefined;
    productMarkup={
      '@context':'https://schema.org','@type':'ProductGroup',name:p.name,description,brand,url:canonical,productGroupID:String(p.sku||p.id),...(images.length?{image:images}:{}),
      ...(variesBy?{variesBy:[variesBy]}:{}),
      hasVariant:variants.map((v:any)=>({
        '@type':'Product',name:`${p.name} — ${v.value}`,sku:v.sku,brand,url:canonical,...((v.imageUrl||p.imageUrl)?{image:[absoluteUrl(v.imageUrl||p.imageUrl)]}:{}),
        ...(variesBy==='https://schema.org/color'?{color:v.value}:{}),
        offers:offerFor(Number(v.price??p.price),Number(v.stockQty||0),Boolean(v.trackStock)),
      }))
    };
  }else{
    productMarkup={
      '@context':'https://schema.org','@type':'Product',name:p.name,description,sku:p.sku,brand,url:canonical,...(images.length?{image:images}:{}),
      offers:offerFor(Number(p.price),Number(p.stockQty||0),Boolean(p.trackStock))
    };
  }
  const breadcrumbs={
    '@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[
      {'@type':'ListItem',position:1,name:'Inicio',item:`${BASE_URL}/`},
      {'@type':'ListItem',position:2,name:p.categoryName||'Tienda',item:p.categorySlug?`${BASE_URL}/catalogo?brand=${encodeURIComponent(p.brandId)}&category=${encodeURIComponent(p.categorySlug)}`:`${BASE_URL}/catalogo?brand=${encodeURIComponent(p.brandId)}`},
      {'@type':'ListItem',position:3,name:p.name,item:canonical},
    ]
  };
  return{title,description,canonical,image:images[0]||absoluteUrl(null),type:'product',robots:'index,follow,max-image-preview:large',jsonLd:[productMarkup,breadcrumbs]};
}

async function categoryName(brand:string,slug:string){const[rows]=await pool.query<any[]>('SELECT name FROM categories WHERE brand_id=? AND slug=? AND active=1 LIMIT 1',[brand,slug]);return rows[0]?.name||null;}

export async function buildSeoData(rawUrl:string):Promise<SeoData>{
  const url=new URL(rawUrl,`${BASE_URL}/`);const path=url.pathname;const brand=url.searchParams.get('brand')==='enyerbados'?'enyerbados':'amargos';
  const siteImage=absoluteUrl('/brand/hero-beach.webp');
  const organization={ '@context':'https://schema.org','@type':'Organization',name:'Bien Amargos',url:`${BASE_URL}/`,logo:absoluteUrl('/brand/bien-amargos-mark.png') };
  const website={ '@context':'https://schema.org','@type':'WebSite',name:'Bien Amargos',url:`${BASE_URL}/`,inLanguage:'es-AR' };
  if(path.startsWith('/producto/')){const product=await productSeo(decodeURIComponent(path.slice('/producto/'.length)));if(product)return product;}
  if(path.startsWith('/admin'))return{title:'Ronda Admin | Bien Amargos',description:'Administración de Bien Amargos.',canonical:`${BASE_URL}${path}`,image:siteImage,type:'website',robots:'noindex,nofollow,noarchive'};
  if(path==='/checkout')return{title:'Finalizar pedido | Bien Amargos',description:'Finalizá tu pedido en Bien Amargos.',canonical:`${BASE_URL}/checkout`,image:siteImage,type:'website',robots:'noindex,nofollow'};
  if(path==='/materos-por-el-mundo')return{title:'Materos por el mundo | Bien Amargos',description:'Conocé los lugares a los que llegó la ronda de Bien Amargos.',canonical:`${BASE_URL}/materos-por-el-mundo`,image:siteImage,type:'website',robots:'index,follow,max-image-preview:large',jsonLd:[organization,website]};
  if(path==='/yerbados')return{title:'Bien Yerbados | Yerbas para tu ronda',description:'Yerbas seleccionadas para acompañar tu ronda. Bien Yerbados, parte de Bien Amargos.',canonical:`${BASE_URL}/yerbados`,image:siteImage,type:'website',robots:'index,follow,max-image-preview:large',jsonLd:[organization,website]};
  if(path==='/catalogo'){
    const category=url.searchParams.get('category');const q=url.searchParams.get('q');const cat=category?await categoryName(brand,category):null;const brandName=brand==='enyerbados'?'Bien Yerbados':'Bien Amargos';
    const canonicalParams=new URLSearchParams();if(brand==='enyerbados')canonicalParams.set('brand','enyerbados');if(category)canonicalParams.set('category',category);
    const canonical=`${BASE_URL}/catalogo${canonicalParams.toString()?`?${canonicalParams.toString()}`:''}`;
    return{title:cat?`${cat} | ${brandName}`:`Tienda | ${brandName}`,description:cat?`Explorá ${cat.toLowerCase()} de ${brandName}.`:`Mates, bombillas, termos, accesorios y yerbas para tu ronda.`,canonical,image:siteImage,type:'website',robots:q?'noindex,follow':'index,follow,max-image-preview:large',jsonLd:[organization,website]};
  }
  if(path==='/'||path==='/tienda')return{title:'Bien Amargos | Mates, bombillas, termos y accesorios',description:'Mates, bombillas, termos, canastas y accesorios para tu ronda. Conocé Bien Amargos y Bien Yerbados.',canonical:`${BASE_URL}/`,image:siteImage,type:'website',robots:'index,follow,max-image-preview:large',jsonLd:[organization,website]};
  return{title:'Página no encontrada | Bien Amargos',description:'La página que buscás no está disponible.',canonical:`${BASE_URL}${path}`,image:siteImage,type:'website',robots:'noindex,follow'};
}

export async function renderSeoDocument(template:string,rawUrl:string){
  const seo=await buildSeoData(rawUrl);let html=template;
  html=setTag(html,/<title[^>]*>.*?<\/title>/is,`<title>${htmlEscape(seo.title)}</title>`);
  html=setTag(html,/<meta\s+name=["']description["'][^>]*>/i,`<meta name="description" content="${htmlEscape(seo.description)}" />`);
  html=setTag(html,/<meta\s+name=["']robots["'][^>]*>/i,`<meta name="robots" content="${htmlEscape(seo.robots)}" />`);
  html=setTag(html,/<link\s+rel=["']canonical["'][^>]*>/i,`<link rel="canonical" href="${htmlEscape(seo.canonical)}" />`);
  const tags=[
    ['property','og:title',seo.title],['property','og:description',seo.description],['property','og:type',seo.type],['property','og:url',seo.canonical],['property','og:image',seo.image],
    ['name','twitter:card','summary_large_image'],['name','twitter:title',seo.title],['name','twitter:description',seo.description],['name','twitter:image',seo.image],
  ] as const;
  for(const [kind,key,value] of tags){const attr=kind==='property'?'property':'name';const re=new RegExp(`<meta\\s+${attr}=["']${key.replace(':','\\:')}["'][^>]*>`,'i');html=setTag(html,re,`<meta ${attr}="${key}" content="${htmlEscape(value)}" />`);}
  html=html.replace(/<script[^>]+id=["']seo-jsonld["'][^>]*>.*?<\/script>/is,'');
  if(seo.jsonLd?.length)html=html.replace('</head>',`  <script id="seo-jsonld" type="application/ld+json">${jsonLd(seo.jsonLd)}</script>\n</head>`);
  const verification=process.env.GOOGLE_SITE_VERIFICATION?.trim();
  if(verification)html=html.replace('</head>',`  <meta name="google-site-verification" content="${htmlEscape(verification)}" />\n</head>`);
  return{html,seo};
}

export const seoRoutes:FastifyPluginAsync=async(app)=>{
  app.get('/sitemap.xml',async(_request,reply)=>{
    const [products]=await pool.query<any[]>('SELECT slug,updated_at AS updatedAt FROM products WHERE active=1 ORDER BY id');
    const [categories]=await pool.query<any[]>('SELECT brand_id AS brandId,slug,updated_at AS updatedAt FROM categories WHERE active=1 ORDER BY brand_id,sort_order,id');
    const urls:{loc:string;lastmod?:string;priority?:string;changefreq?:string}[]=[
      {loc:`${BASE_URL}/`,priority:'1.0',changefreq:'weekly'},
      {loc:`${BASE_URL}/yerbados`,priority:'0.8',changefreq:'weekly'},
      {loc:`${BASE_URL}/catalogo`,priority:'0.9',changefreq:'daily'},
      {loc:`${BASE_URL}/catalogo?brand=enyerbados`,priority:'0.8',changefreq:'daily'},
      {loc:`${BASE_URL}/materos-por-el-mundo`,priority:'0.6',changefreq:'monthly'},
      ...categories.map((c:any)=>({loc:`${BASE_URL}/catalogo?brand=${encodeURIComponent(c.brandId)}&category=${encodeURIComponent(c.slug)}`,lastmod:c.updatedAt?new Date(c.updatedAt).toISOString():undefined,priority:'0.7',changefreq:'weekly'})),
      ...products.map((p:any)=>({loc:`${BASE_URL}/producto/${encodeURIComponent(p.slug)}`,lastmod:p.updatedAt?new Date(p.updatedAt).toISOString():undefined,priority:'0.8',changefreq:'weekly'})),
    ];
    const body=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url><loc>${xmlEscape(u.loc)}</loc>${u.lastmod?`<lastmod>${xmlEscape(u.lastmod)}</lastmod>`:''}${u.changefreq?`<changefreq>${u.changefreq}</changefreq>`:''}${u.priority?`<priority>${u.priority}</priority>`:''}</url>`).join('\n')}\n</urlset>`;
    return reply.type('application/xml; charset=utf-8').header('Cache-Control','public, max-age=1800').send(body);
  });
};
