from pathlib import Path
import re

ROOT = Path(".")
def read(path):
    return (ROOT / path).read_text(encoding="utf-8")
def write(path, content):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")

# --- Admin product editor: one canonical primary image + atomic gallery state ---
p = "src/pages/admin/AdminProductEditor.tsx"
s = read(p)
s = s.replace(
    "images:lines(editor.galleryText),confirmVariantArchive",
    "images:lines(editor.galleryText).filter(image=>image.imageUrl!==editor.imageUrl),confirmVariantArchive"
)
s = s.replace(
    "images:lines(v.imagesText)}))",
    "images:lines(v.imagesText).filter(image=>image.imageUrl!==v.imageUrl)}))"
)
s = s.replace(
    "onUploaded={media=>setEditor(x=>({...x,imageUrl:media.url}))}",
    "onUploaded={media=>setEditor(x=>({...x,imageUrl:media.url,galleryText:withoutLine(x.galleryText,media.url)}))}"
)
s = s.replace(
    "onUploadedMany={media=>setEditor(x=>({...x,galleryText:appendLines(x.galleryText,media.map(item=>item.url).filter(url=>url!==x.imageUrl))}))}",
    "onUploadedMany={media=>setEditor(x=>{const urls=media.map(item=>item.url).filter(Boolean);const main=x.imageUrl||urls[0]||'';return {...x,imageUrl:main,galleryText:appendLines(x.galleryText,urls.filter(url=>url!==main))};})}"
)
s = s.replace(
    "if(picker?.type==='main')setEditor(x=>({...x,imageUrl:url}));else if(picker?.type==='gallery')",
    "if(picker?.type==='main')setEditor(x=>({...x,imageUrl:url,galleryText:withoutLine(x.galleryText,url)}));else if(picker?.type==='gallery')"
)
write(p, s)

# --- New gallery ---
gallery = """import { useCallback, useEffect, useMemo, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowLeft, ArrowRight, Expand } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ProductImage as ProductImageType } from '@/lib/types';
import { ProductImage } from './ProductImage';

export function ProductGallery({
  images,
  fallback,
  recoveryFallback,
  name,
  categoryName,
  zoom = 1,
  positionX = 50,
  positionY = 50,
  blendMode = 'normal',
}: {
  images: ProductImageType[];
  fallback?: string | null;
  recoveryFallback?: string | null;
  name: string;
  categoryName?: string | null;
  zoom?: number | null;
  positionX?: number | null;
  positionY?: number | null;
  blendMode?: string | null;
}) {
  const sources = useMemo(() => {
    const values = [fallback, ...(images || []).map(image => image?.imageUrl), recoveryFallback]
      .map(value => String(value || '').trim())
      .filter(Boolean);
    return Array.from(new Set(values));
  }, [fallback, images, recoveryFallback]);

  const [invalid, setInvalid] = useState<Set<string>>(() => new Set());
  const valid = useMemo(() => sources.filter(src => !invalid.has(src)), [sources, invalid]);
  const [emblaRef, embla] = useEmblaCarousel({
    loop: valid.length > 1,
    align: 'start',
    containScroll: false,
    watchDrag: valid.length > 1,
  });
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const galleryZoom = Math.min(Math.max(Number(zoom) || 1, 0.82), 1.06);

  const sync = useCallback(() => {
    if (!embla) return;
    setSelected(Math.min(embla.selectedScrollSnap(), Math.max(valid.length - 1, 0)));
  }, [embla, valid.length]);

  useEffect(() => {
    setInvalid(new Set());
    setSelected(0);
  }, [sources.join('|')]);

  useEffect(() => {
    if (!embla) return;
    sync();
    embla.on('select', sync);
    embla.on('reInit', sync);
    return () => {
      embla.off('select', sync);
      embla.off('reInit', sync);
    };
  }, [embla, sync]);

  useEffect(() => {
    if (!embla) return;
    embla.reInit({ loop: valid.length > 1, align: 'start', containScroll: false, watchDrag: valid.length > 1 });
    embla.scrollTo(0, true);
    setSelected(0);
  }, [embla, valid.length, valid.join('|')]);

  const markInvalid = useCallback((src: string) => {
    if (!src) return;
    setInvalid(current => {
      if (current.has(src)) return current;
      const next = new Set(current);
      next.add(src);
      return next;
    });
  }, []);

  const current = valid[selected] || valid[0] || recoveryFallback || null;
  const slides = valid.length ? valid : [recoveryFallback].filter(Boolean) as string[];

  return <div className="product-gallery-v86">
    <div className="product-gallery-stage-v86 group/gallery">
      <div ref={emblaRef} className="product-gallery-viewport-v86">
        <div className="product-gallery-track-v86">
          {slides.map((src, imageIndex) => (
            <div className="product-gallery-slide-v86" key={src}>
              <motion.div className="product-gallery-frame-v86" initial={{opacity:.45}} animate={{opacity:1}} transition={{duration:.24}}>
                <ProductImage
                  src={src}
                  alt={imageIndex === 0 ? name : name + ' · foto ' + (imageIndex + 1)}
                  categoryName={categoryName}
                  zoom={galleryZoom}
                  positionX={positionX}
                  positionY={positionY}
                  blendMode={blendMode}
                  onInvalid={() => markInvalid(src)}
                  loading={imageIndex === 0 ? 'eager' : 'lazy'}
                  fetchPriority={imageIndex === 0 ? 'high' : 'low'}
                />
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {valid.length > 1 && <div className="product-gallery-thumbs-v86">
        {valid.map((src, index) => <button
          type="button"
          key={src}
          onClick={() => embla?.scrollTo(index)}
          className={'product-gallery-thumb-v86 ' + (selected === index ? 'is-active' : '')}
          aria-label={'Ver foto ' + (index + 1)}
        ><ProductImage src={src} alt="" empty="none" loading="lazy" fetchPriority="low" onInvalid={()=>markInvalid(src)} /></button>)}
      </div>}

      {valid.length > 1 && <>
        <button type="button" onClick={()=>embla?.scrollPrev()} className="product-gallery-arrow-v86 is-prev" aria-label="Foto anterior"><ArrowLeft size={18}/></button>
        <button type="button" onClick={()=>embla?.scrollNext()} className="product-gallery-arrow-v86 is-next" aria-label="Foto siguiente"><ArrowRight size={18}/></button>
        <div className="product-gallery-dots-v86">{valid.map((src,index)=><button key={src} type="button" onClick={()=>embla?.scrollTo(index)} className={selected===index?'is-active':''} aria-label={'Ir a foto ' + (index + 1)}/>)}</div>
      </>}

      {current && <button type="button" onClick={()=>setLightbox(true)} className="product-gallery-expand-v86" aria-label="Ampliar imagen"><Expand size={16}/><span>Ampliar</span></button>}
    </div>

    <AnimatePresence>{lightbox&&current&&<motion.div className="product-lightbox-v86" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setLightbox(false)}>
      <button type="button" onClick={()=>setLightbox(false)} className="product-lightbox-close-v86">Cerrar ×</button>
      <motion.div initial={{scale:.98,opacity:0}} animate={{scale:1,opacity:1}} className="product-lightbox-image-v86" onClick={event=>event.stopPropagation()}>
        <ProductImage src={current} alt={name} categoryName={categoryName} zoom={1} positionX={50} positionY={50} blendMode="normal" />
      </motion.div>
    </motion.div>}</AnimatePresence>
  </div>;
}
"""
write("src/components/storefront/ProductGallery.tsx", gallery)

# --- Product cards: reset invalid hover image when product/media changes ---
p = "src/components/storefront/ProductCard.tsx"
s = read(p)
needle = "  const [invalidSecond, setInvalidSecond] = useState<string | null>(null);"
if needle in s and "useEffect(() => setInvalidSecond(null)" not in s:
    s = s.replace(needle, needle + "\n  useEffect(() => setInvalidSecond(null), [product.id, product.imageUrl, product.images]);")
write(p, s)

# --- Version strings and Hostinger note ---
for p in ["server/index.ts", "README.md"]:
    path = ROOT / p
    if path.exists():
        x = path.read_text(encoding="utf-8")
        x = x.replace("8.5.0", "8.6.0").replace("V8.5", "V8.6")
        path.write_text(x, encoding="utf-8")

old = ROOT / "README_HOSTINGER_V8.5.txt"
if old.exists():
    old.unlink()
write("README_HOSTINGER_V8.6.txt", """BIEN AMARGOS / BIEN YERBADOS — HOSTINGER V8.6 SOURCE

Entrega de código fuente sin compilar.
No incluye node_modules ni dist.

Cambios principales:
- Product page editorial con galería realmente protagonista.
- Carrusel edge-to-edge, swipe, miniaturas y lightbox.
- Multimedia multi-imagen por lote y sin duplicar la principal.
- Barra superior de anuncios eliminada.
- CTA del hero con contraste alto.
- Descuentos más claros.
- Mayoristas conservado.
- Sin seeds destructivos, DROP ni TRUNCATE.

Hostinger:
Node 22
npm install
npm run build
Entry: server.js
""")

# --- V8.6 visual system ---
p = "src/styles.css"
s = read(p)
if "V8.6 — premium product experience" not in s:
    s += """

/* =========================
   V8.6 — premium product experience
   ========================= */
:root{
  --v86-ink:#122119;
  --v86-green:#123f2e;
  --v86-green-2:#0d3425;
  --v86-paper:#f7f3e9;
  --v86-media:#eee9df;
  --v86-line:rgba(18,33,25,.10);
}
.hero-primary-cta{
  display:inline-flex!important;min-height:54px!important;align-items:center!important;justify-content:center!important;gap:10px!important;
  border:1px solid #0c3325!important;border-radius:14px!important;background:#123f2e!important;color:#fff!important;
  padding:0 22px!important;font-size:11px!important;font-weight:950!important;letter-spacing:-.01em!important;
  box-shadow:0 10px 28px rgba(11,45,32,.16)!important;opacity:1!important;text-shadow:none!important;
  transition:transform .18s ease,background-color .18s ease,box-shadow .18s ease!important
}
.hero-primary-cta:hover{background:#0d3425!important;transform:translateY(-2px)!important;box-shadow:0 16px 34px rgba(11,45,32,.21)!important}
.hero-secondary-cta{
  display:inline-flex!important;min-height:54px!important;align-items:center!important;justify-content:center!important;gap:10px!important;
  border:1px solid rgba(18,33,25,.18)!important;border-radius:14px!important;background:rgba(250,247,239,.94)!important;
  color:#163829!important;padding:0 20px!important;font-size:11px!important;font-weight:900!important;opacity:1!important
}
.product-page-v85{position:relative;padding-top:0!important;padding-left:0!important;padding-right:0!important}
.product-page-v85>div{max-width:none!important;width:100%!important}
.product-page-v85>div>div:first-child{position:absolute;z-index:25;left:18px;top:16px;padding:0!important}
.product-page-v85 .store-subtle-button{margin:0!important;background:rgba(250,247,239,.88)!important}
.product-layout-v85{width:100%;max-width:none!important}
.product-media-v85{width:100%;min-width:0;background:var(--v86-media)}
.product-info-v85{
  border:0!important;border-left:1px solid var(--v86-line)!important;border-radius:0!important;background:rgba(250,247,239,.94)!important;
  box-shadow:none!important;padding:clamp(30px,3.5vw,58px)!important;margin:0!important;backdrop-filter:blur(12px)
}
.product-title-v85{font-size:clamp(2rem,3vw,3.85rem)!important;line-height:.93!important;letter-spacing:-.06em!important;max-width:11ch}
.product-price-v85{font-size:clamp(1.75rem,2.2vw,2.7rem)!important}
.product-variant-chip-v85{background:rgba(255,255,255,.58)!important;border-color:rgba(18,33,25,.12)!important}
.product-variant-chip-v85.is-active{background:#123f2e!important;border-color:#123f2e!important;color:#fff!important}
.product-buy-button-v85{font-size:11px!important;text-transform:none!important;letter-spacing:0!important}
.product-discount-chip-v85,.product-offer-badge{border:1px solid rgba(138,55,29,.13)!important;background:#b9502f!important;color:#fff!important;box-shadow:none!important}

.product-gallery-v86{position:relative;width:100%;min-width:0;background:var(--v86-media)}
.product-gallery-stage-v86{position:relative;width:100%;height:62svh;min-height:500px;overflow:hidden;background:var(--v86-media)}
.product-gallery-viewport-v86{width:100%;height:100%;overflow:hidden}
.product-gallery-track-v86{display:flex;width:100%;height:100%;touch-action:pan-y pinch-zoom}
.product-gallery-slide-v86{flex:0 0 100%;min-width:0;width:100%;height:100%}
.product-gallery-frame-v86{width:100%;height:100%;padding:clamp(20px,4vw,70px)}
.product-gallery-frame-v86>div{height:100%;width:100%}
.product-gallery-thumbs-v86{position:absolute;z-index:15;left:18px;top:50%;display:none;max-height:68%;transform:translateY(-50%);flex-direction:column;gap:8px;overflow-y:auto;padding:3px;scrollbar-width:none}
.product-gallery-thumbs-v86::-webkit-scrollbar{display:none}
.product-gallery-thumb-v86{height:68px;width:68px;flex:none;overflow:hidden;border:1px solid rgba(18,33,25,.10);border-radius:12px;background:rgba(250,247,239,.72);padding:4px;opacity:.62;transition:.18s ease}
.product-gallery-thumb-v86:hover,.product-gallery-thumb-v86.is-active{border-color:#123f2e;opacity:1;background:#fff;transform:translateX(2px)}
.product-gallery-thumb-v86>div{height:100%;width:100%;border-radius:8px;overflow:hidden}
.product-gallery-arrow-v86{position:absolute;z-index:16;top:50%;display:none;height:46px;width:46px;place-items:center;border:1px solid rgba(18,33,25,.12);border-radius:999px;background:rgba(250,247,239,.92);color:#172119;backdrop-filter:blur(12px);transform:translateY(-50%);transition:.18s ease}
.product-gallery-arrow-v86:hover{background:#fff;transform:translateY(-50%) scale(1.04)}
.product-gallery-arrow-v86.is-prev{left:104px}.product-gallery-arrow-v86.is-next{right:18px}
.product-gallery-dots-v86{position:absolute;z-index:16;inset-inline:0;bottom:16px;display:flex;justify-content:center;gap:6px}
.product-gallery-dots-v86 button{height:6px;width:6px;border-radius:999px;background:rgba(18,33,25,.25);transition:.18s ease}
.product-gallery-dots-v86 button.is-active{width:28px;background:#123f2e}
.product-gallery-expand-v86{position:absolute;z-index:16;right:14px;bottom:14px;display:flex;align-items:center;gap:7px;border:1px solid rgba(18,33,25,.11);border-radius:999px;background:rgba(250,247,239,.90);padding:10px 13px;color:#172119;font-size:9px;font-weight:900;backdrop-filter:blur(12px)}
.product-lightbox-v86{position:fixed;z-index:400;inset:0;display:grid;place-items:center;background:rgba(10,14,11,.92);padding:22px}
.product-lightbox-image-v86{width:min(92vw,1300px);height:min(88svh,1000px);background:#f0ece3;border-radius:24px;overflow:hidden;padding:24px}
.product-lightbox-image-v86>div{height:100%;width:100%}
.product-lightbox-close-v86{position:fixed;z-index:401;right:18px;top:18px;border-radius:999px;background:#fff;padding:10px 14px;font-size:10px;font-weight:900;color:#172119}
.store-primary-button--yerbados{background:#173f2f!important;color:#fff!important;border-color:#173f2f!important}
.store-primary-button--yerbados:hover:not(:disabled){background:#0f3225!important}
.store-primary-button--amargos{background:#123f2e!important;color:#fff!important}
.product-card-v5{box-shadow:none!important;border-color:rgba(18,33,25,.08)!important;background:rgba(252,249,242,.78)!important}
.product-card-v5:hover{border-color:rgba(18,63,46,.18)!important}
.admin-product-editor-layout .admin-card{box-shadow:none!important}

@media(min-width:900px){
  .product-page-v85 .product-layout-v85{display:grid!important;grid-template-columns:minmax(0,calc(100vw - 430px)) 430px!important;gap:0!important;align-items:start!important}
  .product-gallery-stage-v86{height:calc(100svh - 104px);min-height:680px}
  .product-gallery-thumbs-v86{display:flex}
  .product-gallery-arrow-v86{display:grid}
  .product-gallery-dots-v86{display:none}
  .product-info-v85{position:sticky!important;top:0!important;min-height:calc(100svh - 104px);display:flex;flex-direction:column;justify-content:center}
}
@media(min-width:1280px){
  .product-page-v85 .product-layout-v85{grid-template-columns:minmax(0,calc(100vw - 480px)) 480px!important}
  .product-gallery-frame-v86{padding:clamp(40px,5vw,92px) clamp(70px,7vw,130px)}
}
@media(max-width:899px){
  .product-page-v85{padding-bottom:82px!important}
  .product-page-v85 .product-layout-v85{display:block!important}
  .product-page-v85>div>div:first-child{top:12px;left:12px}
  .product-info-v85{border-left:0!important;border-top:1px solid var(--v86-line)!important;padding:26px 18px 34px!important}
  .product-gallery-stage-v86{height:min(66svh,690px);min-height:430px}
  .product-gallery-frame-v86{padding:18px 14px 34px}
  .product-gallery-expand-v86 span{display:none}
  .product-title-v85{max-width:none!important;font-size:clamp(2.05rem,10vw,3.1rem)!important}
}
@media(max-width:520px){
  .hero-primary-cta,.hero-secondary-cta{width:100%!important;min-height:52px!important}
  .product-gallery-stage-v86{height:59svh;min-height:390px}
  .product-gallery-frame-v86{padding:14px 8px 34px}
  .product-info-v85{padding:24px 16px 32px!important}
  .product-mobile-buy-v85{background:rgba(247,243,233,.98)!important}
}
@media(prefers-reduced-motion:reduce){
  .product-gallery-thumb-v86,.product-gallery-arrow-v86,.hero-primary-cta{transition:none!important}
}
"""
write(p, s)

with (ROOT / "README.md").open("a", encoding="utf-8") as f:
    f.write("""
\n## V8.6 — Multimedia y Product Experience
La galería usa una colección canónica: imageUrl es la principal y images contiene sólo imágenes adicionales.
Las cargas múltiples se aplican al estado una sola vez por lote para evitar carreras y duplicados.
La ficha usa galería full-width/full-height en desktop, swipe en mobile, miniaturas y lightbox.
""")
