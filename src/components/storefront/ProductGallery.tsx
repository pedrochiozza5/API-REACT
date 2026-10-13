import { type KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Expand, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import type { ProductImage as ProductImageType, BrandId } from '@/lib/types';
import { ProductImage } from './ProductImage';

type Props = {
  images: ProductImageType[];
  fallback?: string | null;
  recoveryFallback?: string | null;
  name: string;
  categoryName?: string | null;
  brand?: BrandId;
  zoom?: number | null;
  positionX?: number | null;
  positionY?: number | null;
  blendMode?: string | null;
};

export function ProductGallery({
  images, fallback, recoveryFallback, name, categoryName,
  brand='amargos', zoom=1, positionX=50, positionY=50, blendMode='normal',
}: Props) {
  const originalUrls=useMemo(()=>Array.from(new Set(
    [fallback,...images.map(item=>item.imageUrl)]
      .map(url=>String(url||'').trim()).filter(Boolean)
  )),[fallback,images]);
  const [failed,setFailed]=useState<Set<string>>(()=>new Set());
  const slides=useMemo(()=>originalUrls.filter(url=>!failed.has(url)),[originalUrls,failed]);
  const displaySlides=slides.length?slides:[recoveryFallback].filter(Boolean) as string[];
  const [viewportRef,embla]=useEmblaCarousel({loop:displaySlides.length>1,align:'start',watchDrag:displaySlides.length>1});
  const [selected,setSelected]=useState(0);
  const thumbsRef=useRef<HTMLDivElement>(null);
  const [lightbox,setLightbox]=useState(false);
  const [zoomed,setZoomed]=useState(false);
  const galleryKey=originalUrls.join('\u0001');

  const sync=useCallback(()=>setSelected(embla?.selectedScrollSnap()||0),[embla]);
  useEffect(()=>{
    if(!embla)return;
    sync();
    embla.on('select',sync).on('reInit',sync);
    return()=>{embla.off('select',sync);embla.off('reInit',sync)};
  },[embla,sync]);
  useEffect(()=>{
    setFailed(new Set());
    setSelected(0);
    embla?.scrollTo(0,true);
  },[galleryKey]);
  useEffect(()=>{
    if(!embla)return;
    embla.reInit({loop:displaySlides.length>1,align:'start',watchDrag:displaySlides.length>1});
    embla.scrollTo(0,true);
  },[embla,displaySlides.length]);
  useEffect(()=>{
    if(!lightbox)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setLightbox(false)};
    window.addEventListener('keydown',close);
    return()=>{document.body.style.overflow=previous;window.removeEventListener('keydown',close)};
  },[lightbox]);
  useEffect(()=>{
    const next=slides[(selected+1)%slides.length];
    if(!next||slides.length<2)return;
    const img=new Image();img.decoding='async';img.src=next;
  },[selected,slides]);

  // Keep the active thumbnail visible when swiping long 6–10 image galleries.
  // The main viewport retains native vertical page scrolling (touch-pan-y).
  useEffect(() => {
    const active=thumbsRef.current?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!active) return;
    active.scrollIntoView({ block: 'nearest', inline: 'nearest',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, [selected, displaySlides.length]);

  const current=displaySlides[Math.min(selected,Math.max(0,displaySlides.length-1))]||null;
  const safeZoom=Math.min(Math.max(Number(zoom)||1,.82),1.4);
  const markFailed=useCallback((url:string)=>setFailed(old=>new Set(old).add(url)),[]);
  function onKeyDown(event:ReactKeyboardEvent<HTMLDivElement>){
    if(!embla||displaySlides.length<2)return;
    if(event.key==='ArrowLeft'){event.preventDefault();embla.scrollPrev()}
    if(event.key==='ArrowRight'){event.preventDefault();embla.scrollNext()}
  }

  return <>
    <section
      tabIndex={0}
      onKeyDown={onKeyDown}
      aria-label={`Galería de ${name}`}
      className={`v11-product-stage ${brand==='enyerbados'?'v11-product-stage--yerbados':''} relative isolate min-w-0 overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174a36]`}
    >
      <div className="v11-product-stage__top" aria-hidden="true">
        <span>LA SELECCIÓN</span>
        <span>{categoryName||'COLECCIÓN'}</span>
      </div>
      <div className="v11-product-stage__layout">
        {displaySlides.length>1&&<div ref={thumbsRef} className="v11-product-thumbs" role="group" aria-label="Miniaturas de producto">
          {displaySlides.map((url,index)=><button
            key={url} type="button" onClick={()=>embla?.scrollTo(index)}
            aria-label={`Ver imagen ${index+1} de ${displaySlides.length}`}
            aria-current={selected===index?'true':undefined}
            className={`v11-product-thumb ${selected===index?'is-active':''}`}
          ><ProductImage src={url} alt="" empty="none" zoom={1} onInvalid={()=>markFailed(url)}/></button>)}
        </div>}
        <div ref={viewportRef} className="v11-product-stage__viewport">
          <div className="flex h-full touch-pan-y">
            {!displaySlides.length && <div className="v11-product-stage__slide"><ProductImage src={null} alt={name} categoryName={categoryName}/></div>}
            {displaySlides.map((url,index)=><div key={url} className="v11-product-stage__slide">
              <ProductImage
                src={url} alt={index===0?name:`${name}, foto ${index+1}`}
                categoryName={categoryName} onInvalid={()=>markFailed(url)}
                zoom={safeZoom} positionX={positionX} positionY={positionY}
                blendMode={blendMode}
                loading={index===0?'eager':'lazy'} fetchPriority={index===0?'high':'low'}
                className="v11-product-stage__photo" imageClassName="object-contain"
              />
            </div>)}
          </div>
        </div>
      </div>
      <div className="v11-product-stage__bottom">
        {displaySlides.length > 1
          ? <span className="font-mono-ui text-[11px] font-bold uppercase tracking-[.12em]">
              {String(selected+1).padStart(2,'0')} / {String(displaySlides.length).padStart(2,'0')}
            </span>
          : <span className="text-[11px] font-semibold text-[#415a48]">Vista del producto</span>}
        <div className="flex items-center gap-3">
          {displaySlides.length > 1 && <span className="hidden text-[11px] font-semibold text-[#476150] sm:inline">Elegí una foto desde las miniaturas</span>}
          {displaySlides.length > 1 && <span className="text-[11px] font-semibold text-[#476150] sm:hidden">Deslizá para explorar</span>}
          {current && <button
            type="button"
            className="v11-product-nav v11-product-nav--expand"
            onClick={() => { setZoomed(false); setLightbox(true); }}
            aria-label="Ampliar imagen"
          ><Expand size={16} /><span>Ampliar</span></button>}
        </div>
      </div>
    </section>

    <Dialog.Root open={lightbox && !!current} onOpenChange={open => { setLightbox(open); if (!open) setZoomed(false); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[500] bg-[#0b1710]/90" />
        <Dialog.Content className="fixed inset-0 z-[501] flex flex-col gap-3 overflow-hidden p-3 outline-none sm:p-6" aria-describedby={undefined}>
          <div className="flex items-center justify-between gap-3 text-white">
            <Dialog.Title className="min-w-0 truncate text-sm font-semibold">
              {name}{displaySlides.length>1 ? ` · ${selected+1} de ${displaySlides.length}` : ''}
            </Dialog.Title>
            <Dialog.Close asChild><button type="button" aria-label="Cerrar imagen ampliada" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#172119] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><X size={20}/></button></Dialog.Close>
          </div>
          <button
            type="button"
            className="mx-auto flex min-h-0 w-full max-w-[1200px] flex-1 cursor-zoom-in items-center justify-center overflow-hidden rounded-[14px] bg-[#f5f2e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            onClick={() => setZoomed(old => !old)}
            aria-label={zoomed ? 'Reducir imagen' : 'Acercar imagen'}
          >
            <ProductImage src={current} alt={name} zoom={zoomed ? 1.4 : 1} loading="eager" />
          </button>
          <span className="text-center text-[11px] text-white/70">Tocá la fotografía para {zoomed ? 'reducir' : 'ampliar'}</span>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}
