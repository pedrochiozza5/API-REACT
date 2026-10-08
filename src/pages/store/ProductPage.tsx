import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { ProductGallery } from '@/components/storefront/ProductGalleryV86';
import { StoreBackdrop } from '@/components/storefront/StoreBackdrop';
import { BrandGlyph } from '@/components/storefront/BrandGlyph';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiGet } from '@/lib/api';
import { money } from '@/lib/format';
import { legacyProductImage } from '@/lib/productImages';
import type { Product, ProductImage, ProductVariant } from '@/lib/types';
import { useCart } from '@/store/cart';

export function ProductPage() {
  const { slug = '' } = useParams();
  const [qty, setQty] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const add = useCart((s) => s.add);
  const setCartOpen = useCart((s) => s.setOpen);
  const { data: product, isLoading, error } = useQuery({ queryKey: ['product', slug], queryFn: () => apiGet<Product>(`/api/products/${encodeURIComponent(slug)}`) });

  useEffect(() => {
    if (!product) return;
    const brandName = product.brandId === 'amargos' ? 'Bien Amargos' : 'Bien Yerbados';
    const canonicalUrl = `https://bienamargos.com.ar/producto/${product.slug}`;
    const title = product.seoTitle || `${product.name} | ${brandName}`;
    const description = product.seoDescription || product.shortDescription || product.description || `${product.name} en ${brandName}.`;
    const image = product.imageUrl ? new URL(product.imageUrl, 'https://bienamargos.com.ar').toString() : 'https://bienamargos.com.ar/brand/bien-amargos-mark.png';
    const ensureMeta=(selector:string,attrs:Record<string,string>)=>{let el=document.head.querySelector<HTMLMetaElement>(selector);if(!el){el=document.createElement('meta');document.head.appendChild(el);}Object.entries(attrs).forEach(([k,v])=>el!.setAttribute(k,v));return el;};
    document.title = title;
    ensureMeta('meta[name="description"]',{name:'description',content:description});
    ensureMeta('meta[name="robots"]',{name:'robots',content:'index,follow,max-image-preview:large'});
    ensureMeta('meta[property="og:title"]',{property:'og:title',content:title});
    ensureMeta('meta[property="og:description"]',{property:'og:description',content:description});
    ensureMeta('meta[property="og:type"]',{property:'og:type',content:'product'});
    ensureMeta('meta[property="og:url"]',{property:'og:url',content:canonicalUrl});
    ensureMeta('meta[property="og:image"]',{property:'og:image',content:image});
    ensureMeta('meta[name="twitter:card"]',{name:'twitter:card',content:'summary_large_image'});
    ensureMeta('meta[name="twitter:title"]',{name:'twitter:title',content:title});
    ensureMeta('meta[name="twitter:description"]',{name:'twitter:description',content:description});
    ensureMeta('meta[name="twitter:image"]',{name:'twitter:image',content:image});
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.appendChild(canonical);}canonical.href=canonicalUrl;
    const activeVariants=(product.variants||[]).filter(v=>Boolean(v.active));
    const abs=(value?:string|null)=>value?new URL(value,'https://bienamargos.com.ar').toString():image;
    const offer=(price:number,stock:number,track:boolean)=>({'@type':'Offer',url:canonicalUrl,priceCurrency:'ARS',price:Number(price),availability:!track||stock>0?'https://schema.org/InStock':'https://schema.org/OutOfStock',seller:{'@type':'Organization',name:'Bien Amargos'}});
    const brand={'@type':'Brand',name:brandName};
    let structured:any;
    const structuredImages=[product.imageUrl,...(product.images||[]).map(i=>i.imageUrl)].filter(Boolean).map(v=>abs(String(v)));
    if(activeVariants.length){const n=String(activeVariants[0]?.name||'').toLowerCase();const variesBy=n.includes('color')?'https://schema.org/color':n.includes('tama')||n.includes('size')?'https://schema.org/size':undefined;structured={'@context':'https://schema.org','@type':'ProductGroup',name:product.name,description,brand,url:canonicalUrl,productGroupID:String(product.sku||product.id),...(structuredImages.length?{image:structuredImages}:{}),...(variesBy?{variesBy:[variesBy]}:{}),hasVariant:activeVariants.map(v=>({'@type':'Product',name:`${product.name} — ${v.value}`,sku:v.sku,brand,url:canonicalUrl,...((v.imageUrl||product.imageUrl)?{image:[abs(v.imageUrl||product.imageUrl)]}:{}),...(variesBy==='https://schema.org/color'?{color:v.value}:{}),offers:offer(Number(v.price??product.price),Number(v.stockQty||0),Boolean(v.trackStock))}))};}
    else structured={'@context':'https://schema.org','@type':'Product',name:product.name,description,sku:product.sku,brand,url:canonicalUrl,...(structuredImages.length?{image:structuredImages}:{}),offers:offer(Number(product.price),Number(product.stockQty||0),Boolean(product.trackStock))};
    let script=document.getElementById('seo-jsonld') as HTMLScriptElement|null;if(!script){script=document.createElement('script');script.id='seo-jsonld';script.type='application/ld+json';document.head.appendChild(script);}script.text=JSON.stringify(structured).replace(/</g,'\\u003c');
    return () => { script?.remove(); };
  }, [product]);

  const variants = useMemo(() => (product?.variants || []).filter((v) => Boolean(v.active)).sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0)), [product]);
  useEffect(() => { setSelectedId(variants.length === 1 ? variants[0].id : null); setQty(1); }, [product?.id, variants.length]);
  const selected: ProductVariant | null = variants.find((v) => v.id === selectedId) || null;
  const brand = product?.brandId || 'amargos';
  const yerbados = brand === 'enyerbados';
  const stock = Number(selected ? selected.stockQty : variants.length ? 0 : product?.stockQty || 0);
  const trackStock = selected ? Boolean(selected.trackStock) : variants.length ? true : Boolean(product?.trackStock);
  const soldOut = selected ? trackStock && stock <= 0 : product?.hasVariants && variants.length===0 ? true : variants.length ? false : trackStock && stock <= 0;
  const price = Number(selected?.price ?? product?.price ?? 0);
  const compare = Number(selected?.compareAtPrice ?? product?.compareAtPrice ?? 0);
  const hasDiscount = compare > price && price >= 0;
  const discount = hasDiscount ? Math.max(1, Math.round((1 - price / compare) * 100)) : 0;

  const gallery = useMemo<ProductImage[]>(() => {
    if (!product) return [];
    const all = [
      ...(selected?.images || []),
      ...(product.images || []),
    ];
    const seen = new Set<string>();
    return all.filter((image) => {
      const url = String(image?.imageUrl || '').trim();
      if (!url || seen.has(url)) return false;
      seen.add(url);
      return true;
    });
  }, [product, selected]);
  const fallback = selected?.imageUrl || product?.imageUrl || gallery[0]?.imageUrl || null;
  const recoveryFallback = product ? legacyProductImage(product) : null;
  const imageZoom = Number(selected?.imageZoom ?? product?.imageZoom ?? 1.03);
  const imagePositionX = Number(selected?.imagePositionX ?? product?.imagePositionX ?? 50);
  const imagePositionY = Number(selected?.imagePositionY ?? product?.imagePositionY ?? 50);
  const imageBlendMode = selected?.imageBlendMode ?? product?.imageBlendMode ?? 'normal';
  const maxQty = trackStock ? Math.max(stock, 1) : 30;
  const canAdd = !!product && (!product.hasVariants || !!selected) && !soldOut;

  function addCurrent() {
    if (!product) return;
    if (variants.length && !selected) return toast.error('Elegí una variante antes de agregar.');
    if (soldOut) return toast.error('Esa variante está agotada.');
    add(product, qty, selected);
    setCartOpen(true);
    toast.success(`${product.name}${selected ? ` · ${selected.value}` : ''} agregado`);
  }

  if (isLoading) return <main className="storefront-page min-h-screen pt-28"><StoreBackdrop brand="amargos"/><div className="storefront-content"><Header brand="amargos" solid /><div className="section-glass mx-auto mt-6 h-[650px] max-w-[1450px] animate-pulse rounded-[38px]" /></div></main>;
  if (error || !product) return <main className="storefront-page min-h-screen pt-28"><StoreBackdrop brand="amargos"/><div className="storefront-content"><Header brand="amargos" solid /><div className="section-glass mx-auto mt-6 max-w-2xl rounded-[38px] px-6 py-20 text-center"><h1 className="text-4xl font-black">Producto no encontrado</h1><Link to="/catalogo" className="mt-5 inline-block rounded-full bg-[#171914] px-5 py-3 text-sm font-bold text-white">Volver</Link></div></div></main>;

  return <main className={`storefront-page ${yerbados ? 'storefront-page--yellow' : 'storefront-page--green'} min-h-screen pt-[96px] sm:pt-[108px]`}>
    <StoreBackdrop brand={brand} />
    <div className="storefront-content">
      <Header brand={brand} solid hideMobileDock />
      <section className="product-page-v85 pb-32 pt-2 sm:px-5 sm:pb-20 lg:px-7 lg:pb-24 lg:pt-6">
        <div className="mx-auto max-w-[1780px]">
          <div className="px-3 sm:px-0">
            <Link to={`/catalogo?brand=${brand}`} className="store-subtle-button mb-3 sm:mb-4"><ArrowLeft size={14}/> Tienda</Link>
          </div>

          <div className="product-layout-v85 grid min-w-0 gap-0 sm:gap-5 lg:grid-cols-[minmax(0,1.58fr)_minmax(340px,.62fr)] lg:items-start lg:gap-7 xl:gap-9">
            <motion.div className="product-media-v85 min-w-0" key={selected?.id || 'base'} initial={{ opacity: .72 }} animate={{ opacity: 1 }}>
              <ProductGallery
                images={gallery}
                fallback={fallback}
                recoveryFallback={recoveryFallback}
                name={product.name}
                categoryName={product.categoryName}
                zoom={imageZoom}
                positionX={imagePositionX}
                positionY={imagePositionY}
                blendMode={imageBlendMode}
              />
            </motion.div>

            <aside className="product-info-v85 mx-3 mt-4 sm:mx-0 sm:mt-0 lg:sticky lg:top-24 lg:h-fit">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 font-mono-ui text-[8px] font-semibold uppercase tracking-[.18em] text-black/40"><BrandGlyph kind={yerbados ? 'yerba' : 'mate'} className="h-4 w-4" />{yerbados ? 'Bien Yerbados' : 'Bien Amargos'} · {product.categoryName || 'Selección'}</div>
                {hasDiscount && <span className="product-discount-chip-v85">-{discount}% · oferta</span>}
              </div>

              <h1 className="product-title-v85 mt-3 text-balance font-black text-[#172119]">{product.name}</h1>

              <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <div className="product-price-v85 font-black tracking-[-.045em]">{money(price)}</div>
                {hasDiscount && <div className="text-[12px] font-bold text-black/32 line-through sm:text-sm">{money(compare)}</div>}
              </div>
              {hasDiscount && <div className="mt-1 text-[9px] font-black uppercase tracking-[.12em] text-[#a34b2d]">Ahorrás {money(compare-price)}</div>}

              {product.shortDescription && <p className="mt-4 max-w-xl text-[12px] font-semibold leading-[1.65] text-black/50 sm:text-[13px]">{product.shortDescription}</p>}

              <div className="mt-4 flex flex-wrap items-center gap-2 border-y border-black/[.07] py-3">
                <span className="font-mono-ui text-[8px] uppercase tracking-[.12em] text-black/34">SKU {selected?.sku || product.sku}</span>
                <span className="h-1 w-1 rounded-full bg-black/15"/>
                <span className={`inline-flex items-center gap-1.5 text-[9px] font-black ${soldOut ? 'text-red-600' : selected && stock <= 3 ? 'text-amber-700' : 'text-emerald-700'}`}><span className={`h-1.5 w-1.5 rounded-full ${soldOut ? 'bg-red-500' : selected && stock <= 3 ? 'bg-amber-500' : 'bg-emerald-600'}`}/>{soldOut ? 'Agotado' : !trackStock ? 'Disponible' : selected && stock <= 3 ? `Últimas ${stock}` : 'Disponible'}</span>
              </div>

              {product.hasVariants && variants.length === 0 && <div className="mt-5 rounded-[16px] border border-amber-200 bg-amber-50/80 p-4 text-xs font-bold text-amber-800">Este producto no tiene variantes disponibles por el momento.</div>}

              {variants.length > 0 && <div className="mt-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-black">Elegí {variants[0]?.name?.toLowerCase() || 'variante'}</div>
                    <div className="mt-1 text-[9px] font-semibold text-black/36">{selected ? selected.value : 'Seleccioná una opción.'}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  {variants.map((v) => {
                    const out=Boolean(v.trackStock)&&Number(v.stockQty)<=0;
                    return <button key={v.id} disabled={out} onClick={() => { setSelectedId(v.id); setQty(1); }} className={`product-variant-chip-v85 group flex min-h-[48px] items-center gap-2.5 rounded-[14px] border px-3 transition sm:min-h-10 sm:rounded-full ${selected?.id === v.id ? 'is-active' : ''} ${out?'cursor-not-allowed opacity-40':''}`}>
                      <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-full"><span className="h-5 w-5 rounded-full border border-black/10" style={{ background: v.colorHex || '#d8d0bf' }} />{selected?.id===v.id&&<Check size={11} className="absolute text-white drop-shadow"/>}</span>
                      <span className="min-w-0 flex-1 text-left sm:flex-none"><span className="block truncate text-[10px] font-extrabold">{v.value}</span><span className="block text-[7px] font-semibold text-black/35 sm:hidden">{out?'Agotado':'Disponible'}</span></span>
                    </button>;
                  })}
                </div>
              </div>}

              <div className="mt-6 hidden gap-2.5 border-t border-black/[.07] pt-5 sm:flex">
                <div className="store-quantity-control"><button onClick={() => setQty((q) => Math.max(1, q-1))} className="store-quantity-button" aria-label="Restar cantidad"><Minus size={16}/></button><span className="min-w-9 text-center text-sm font-black">{qty}</span><button disabled={!canAdd} onClick={() => setQty((q) => Math.min(maxQty, q+1))} className="store-quantity-button disabled:opacity-30" aria-label="Sumar cantidad"><Plus size={16}/></button></div>
                <button disabled={!canAdd} onClick={addCurrent} className={`store-primary-button product-buy-button-v85 flex h-14 flex-1 items-center justify-center gap-2 rounded-[16px] ${yerbados ? 'store-primary-button--yerbados' : 'store-primary-button--amargos'}`}><ShoppingBag size={17}/> {variants.length && !selected ? 'Elegí una variante' : soldOut ? 'Sin stock' : 'Agregar a la ronda'}</button>
              </div>

              <Tabs defaultValue="detalle" className="mt-6 border-t border-black/[.07] pt-4">
                <TabsList><TabsTrigger value="detalle">Detalle</TabsTrigger><TabsTrigger value="entrega">Entrega</TabsTrigger></TabsList>
                <TabsContent value="detalle" className="mt-4 max-w-xl text-[12px] leading-[1.7] text-black/52">{product.description || product.shortDescription || 'Selección de la casa.'}</TabsContent>
                <TabsContent value="entrega" className="mt-4 max-w-xl text-[12px] leading-[1.7] text-black/52">Envíos a todo el país y retiro coordinado en Mar de Ajó. La compra se confirma por WhatsApp.</TabsContent>
              </Tabs>
            </aside>
          </div>
        </div>
      </section>
      <Footer brand={brand} />
    </div>

    <div className="product-mobile-buy-v85 fixed inset-x-0 bottom-0 z-50 border-t border-black/8 bg-[#fbf8f1]/96 p-2.5 pb-[calc(.65rem+env(safe-area-inset-bottom))] backdrop-blur-xl sm:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-2">
        <div className="store-quantity-control h-[50px] rounded-[14px]"><button onClick={()=>setQty(q=>Math.max(1,q-1))} className="store-quantity-button h-10 w-9" aria-label="Restar cantidad"><Minus size={14}/></button><span className="min-w-6 text-center text-xs font-black">{qty}</span><button disabled={!canAdd} onClick={()=>setQty(q=>Math.min(maxQty,q+1))} className="store-quantity-button h-10 w-9 disabled:opacity-30" aria-label="Sumar cantidad"><Plus size={14}/></button></div>
        <button type="button" disabled={!canAdd} onClick={addCurrent} className={`store-primary-button flex h-[50px] flex-1 items-center justify-between rounded-[14px] px-4 ${yerbados ? 'store-primary-button--yerbados' : 'store-primary-button--amargos'}`}><span className="text-[10px]">{variants.length&&!selected?'Elegí una variante':soldOut?'Sin stock':'Agregar'}</span><span className="text-[11px]">{money(price*qty)}</span></button>
      </div>
    </div>
  </main>;
}
