import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { ProductImage as ProductImageType } from '@/lib/types';
import { ProductImage } from './ProductImage';

type Props = {
  images: ProductImageType[];
  fallback?: string | null;
  recoveryFallback?: string | null;
  name: string;
  categoryName?: string | null;
  zoom?: number | null;
  positionX?: number | null;
  positionY?: number | null;
  blendMode?: string | null;
};

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
}: Props) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const urls = useMemo(
    () => Array.from(new Set(
      [fallback, ...(images || []).map(image => image.imageUrl)]
        .map(value => String(value || '').trim())
        .filter(Boolean),
    )),
    [fallback, images],
  );
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const slides = useMemo(() => urls.filter(url => !failed.has(url)), [urls, failed]);
  const [viewportRef, api] = useEmblaCarousel({
    loop: slides.length > 1,
    align: 'start',
    containScroll: false,
    watchDrag: slides.length > 1,
  });
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const sync = useCallback(() => {
    if (!api) return;
    setSelected(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    sync();
    api.on('select', sync);
    api.on('reInit', sync);
    return () => {
      api.off('select', sync);
      api.off('reInit', sync);
    };
  }, [api, sync]);

  useEffect(() => {
    setFailed(new Set());
    setSelected(0);
  }, [urls.join('|')]);

  useEffect(() => {
    if (!api) return;
    api.reInit({
      loop: slides.length > 1,
      align: 'start',
      containScroll: false,
      watchDrag: slides.length > 1,
    });
    api.scrollTo(0, true);
    setSelected(0);
  }, [api, slides.length, slides.join('|')]);

  // Decode only the next image, not the entire gallery.
  useEffect(() => {
    if (slides.length < 2) return;
    const next = slides[(selected + 1) % slides.length];
    if (!next) return;
    const image = new Image();
    image.decoding = 'async';
    image.src = next;
  }, [selected, slides]);

  const markFailed = useCallback((url:string) => {
    setFailed(current => {
      if (current.has(url)) return current;
      const next = new Set(current);
      next.add(url);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightbox(false);
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [lightbox]);

  const current = slides[selected] || slides[0] || recoveryFallback || null;
  const visibleSlides = slides.length ? slides : [recoveryFallback].filter(Boolean) as string[];
  const safeZoom = Math.min(Math.max(Number(zoom) || 1, .86), 1.06);

  function onKeyDown(event:KeyboardEvent<HTMLDivElement>) {
    if (!api || slides.length < 2) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      api.scrollPrev();
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      api.scrollNext();
    }
  }

  return <>
    <div
      ref={rootRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="group/gallery relative h-[66svh] min-h-[430px] w-screen overflow-hidden bg-transparent outline-none sm:h-[74svh] lg:h-[calc(100svh-96px)] lg:min-h-[650px]"
      aria-label={`Galería de ${name}`}
    >
      <div ref={viewportRef} className="h-full w-full overflow-hidden">
        <div className="flex h-full w-full touch-pan-y">
          {visibleSlides.map((src,index) => <div key={src} className="relative h-full min-w-0 flex-[0_0_100%] bg-[linear-gradient(90deg,rgba(250,247,239,.46)_0%,rgba(250,247,239,.28)_56%,rgba(250,247,239,.12)_100%)]">
            <motion.div
              initial={reduceMotion ? false : { opacity: .45, scale: .995 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduceMotion ? 0 : .24 }}
              className="absolute inset-0 px-1 pb-16 pt-3 sm:px-8 sm:pb-20 sm:pt-6 lg:pb-20 lg:pl-[5vw] lg:pr-[430px] lg:pt-6 xl:pr-[455px]"
            >
              <ProductImage
                src={src}
                alt={index === 0 ? name : `${name} · foto ${index + 1}`}
                categoryName={categoryName}
                zoom={safeZoom}
                positionX={positionX}
                positionY={positionY}
                blendMode={blendMode}
                onInvalid={() => markFailed(src)}
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'low'}
                className="bg-transparent"
                imageClassName="object-contain drop-shadow-[0_24px_34px_rgba(27,32,23,.10)] transition-opacity duration-200"
              />
            </motion.div>
          </div>)}
        </div>
      </div>

      {slides.length > 1 && <>
        <button type="button" onClick={()=>api?.scrollPrev()} aria-label="Imagen anterior" className="absolute left-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-[#fbf8f1]/92 text-[#173429] backdrop-blur-xl transition hover:bg-white sm:left-5 lg:h-12 lg:w-12"><ChevronLeft size={20}/></button>
        <button type="button" onClick={()=>api?.scrollNext()} aria-label="Imagen siguiente" className="absolute right-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-[#fbf8f1]/92 text-[#173429] backdrop-blur-md transition hover:bg-white sm:right-5 lg:right-[430px] lg:h-12 lg:w-12 xl:right-[455px]"><ChevronRight size={20}/></button>

        <div className="absolute bottom-3 left-1/2 z-20 flex max-w-[70vw] -translate-x-1/2 gap-2 overflow-x-auto rounded-2xl border border-white/45 bg-[#fbf8f1]/82 p-2 backdrop-blur-md sm:bottom-5 lg:left-[calc(50%-210px)]">
          {slides.map((src,index) => <button
            type="button"
            key={src}
            onClick={()=>api?.scrollTo(index)}
            aria-label={`Ver imagen ${index+1}`}
            className={`h-11 w-11 shrink-0 overflow-hidden rounded-xl border p-1 transition sm:h-14 sm:w-14 ${selected===index?'border-[#174a36] bg-white opacity-100':'border-transparent bg-white/60 opacity-55 hover:opacity-100'}`}
          ><ProductImage src={src} alt="" empty="none" loading="lazy" fetchPriority="low" onInvalid={()=>markFailed(src)} /></button>)}
        </div>

        <div className="absolute bottom-4 left-3 z-20 rounded-full border border-black/8 bg-[#fbf8f1]/90 px-3 py-2 font-mono-ui text-[8px] font-black tracking-[.12em] text-[#173429] backdrop-blur-xl sm:left-5">{selected+1} / {slides.length}</div>
      </>}

      {current && <button type="button" onClick={()=>setLightbox(true)} className="absolute bottom-4 right-3 z-20 flex h-10 items-center gap-2 rounded-full border border-black/8 bg-[#fbf8f1]/90 px-3 text-[9px] font-black text-[#173429] backdrop-blur-md transition hover:bg-white sm:right-5 lg:right-[430px] xl:right-[455px]"><Maximize2 size={14}/><span className="hidden sm:inline">Ampliar</span></button>}
    </div>

    <AnimatePresence>{lightbox && current && <motion.div
      initial={{opacity:0}}
      animate={{opacity:1}}
      exit={{opacity:0}}
      className="fixed inset-0 z-[500] grid place-items-center bg-[#090d0a]/95 p-3 sm:p-6"
      onClick={()=>setLightbox(false)}
    >
      <button type="button" onClick={()=>setLightbox(false)} aria-label="Cerrar imagen ampliada" className="fixed right-4 top-4 z-[501] grid h-11 w-11 place-items-center rounded-full bg-white text-[#172119]"><X size={20}/></button>
      <div className="h-[88svh] w-[94vw] max-w-[1500px] overflow-hidden rounded-[18px] bg-[#f0ece3] p-2 sm:rounded-[26px] sm:p-6" onClick={event=>event.stopPropagation()}>
        <ProductImage src={current} alt={name} zoom={1} positionX={50} positionY={50} blendMode="normal" />
      </div>
    </motion.div>}</AnimatePresence>
  </>;
}
