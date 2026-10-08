import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE='https://bienamargos.com.ar';
function ensureMeta(selector:string,attributes:Record<string,string>){let el=document.head.querySelector<HTMLMetaElement>(selector);if(!el){el=document.createElement('meta');document.head.appendChild(el);}Object.entries(attributes).forEach(([k,v])=>el!.setAttribute(k,v));return el;}
function ensureCanonical(){let el=document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');if(!el){el=document.createElement('link');el.rel='canonical';document.head.appendChild(el);}return el;}
function setStaticSeo(title:string,description:string,canonical:string,robots='index,follow,max-image-preview:large'){
  document.title=title;
  ensureMeta('meta[name="description"]',{name:'description',content:description});
  ensureMeta('meta[name="robots"]',{name:'robots',content:robots});
  ensureMeta('meta[property="og:title"]',{property:'og:title',content:title});
  ensureMeta('meta[property="og:description"]',{property:'og:description',content:description});
  ensureMeta('meta[property="og:type"]',{property:'og:type',content:'website'});
  ensureMeta('meta[property="og:url"]',{property:'og:url',content:canonical});
  ensureMeta('meta[property="og:image"]',{property:'og:image',content:`${BASE}/brand/hero-beach.webp`});
  ensureMeta('meta[name="twitter:card"]',{name:'twitter:card',content:'summary_large_image'});
  ensureMeta('meta[name="twitter:title"]',{name:'twitter:title',content:title});
  ensureMeta('meta[name="twitter:description"]',{name:'twitter:description',content:description});
  ensureCanonical().href=canonical;
  document.getElementById('seo-jsonld')?.remove();
}
export function RouteTitle(){const{pathname,search}=useLocation();useEffect(()=>{
  if(pathname.startsWith('/producto/'))return;
  const params=new URLSearchParams(search);
  if(pathname.startsWith('/admin'))return setStaticSeo('Ronda Admin | Bien Amargos','Administración de Bien Amargos.',`${BASE}${pathname}`,'noindex,nofollow,noarchive');
  if(pathname==='/checkout')return setStaticSeo('Finalizar pedido | Bien Amargos','Finalizá tu pedido en Bien Amargos.',`${BASE}/checkout`,'noindex,nofollow');
  if(pathname==='/materos-por-el-mundo')return setStaticSeo('Materos por el mundo | Bien Amargos','Conocé los lugares a los que llegó la ronda de Bien Amargos.',`${BASE}/materos-por-el-mundo`);
  if(pathname==='/yerbados')return setStaticSeo('Bien Yerbados | Yerbas para tu ronda','Yerbas seleccionadas para acompañar tu ronda. Bien Yerbados, parte de Bien Amargos.',`${BASE}/yerbados`);
  if(pathname==='/catalogo'){
    const brand=params.get('brand')==='enyerbados'?'Bien Yerbados':'Bien Amargos';
    const canonicalParams=new URLSearchParams();if(params.get('brand')==='enyerbados')canonicalParams.set('brand','enyerbados');if(params.get('category'))canonicalParams.set('category',params.get('category')!);
    const canonical=`${BASE}/catalogo${canonicalParams.toString()?`?${canonicalParams.toString()}`:''}`;
    return setStaticSeo(`Tienda | ${brand}`,'Mates, bombillas, termos, accesorios y yerbas para tu ronda.',canonical,params.get('q')?'noindex,follow':'index,follow,max-image-preview:large');
  }
  if(pathname==='/')return setStaticSeo('Bien Amargos | Mates, bombillas, termos y accesorios','Mates, bombillas, termos, canastas y accesorios para tu ronda. Conocé Bien Amargos y Bien Yerbados.',`${BASE}/`);
  return setStaticSeo('Página no encontrada | Bien Amargos','La página que buscás no está disponible.',`${BASE}${pathname}`,'noindex,follow');
},[pathname,search]);return null;}
