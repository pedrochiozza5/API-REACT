import { useCallback, useEffect, useMemo, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
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

export function ProductGallery(props: Props) {
  const { images, fallback, recoveryFallback, name, categoryName, zoom=1, positionX=50, positionY=50, blendMode='normal' } = props;
  const urls = useMemo(() => Array.from(new Set(
    [fallback, ...(images || []).map(x => x.imageUrl), recoveryFallback]
      .map(x => String(x || '').trim()).filter(Boolean)
  )), [fallback, images, recoveryFallback]);

  const [failed, setFailed] = useState<Set<string>>(new Set());
  const slides = useMemo(() => urls.filter(url => !failed.has(url)), [urls, failed]);
  const [viewportRef, api] = useEmblaCarousel({ loop: slides.length > 1, align: 'start', containScroll: false });
  const [selected, setSelected] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const sync = useCallback(() => setSelected(api?.selectedScrollSnap() || 0), [api]);
  useEffect(() => {
    if (!api) return;
    sync();
    api.on('select', sync);
    api.on('reInit', sync);
    return () => { api.off('select', sync); api.off('reInit', sync); };
  }, [api, sync]);
  useEffect(() => {
    setFailed(new Set());
    setSelected(0);
  }, [urls.join('|')]);
  useEffect(() => {
    if (!api) return;
    api.reInit({ loop: slides.length > 1, align: 'start', containScroll: false });
    api.scrollTo(0, true);
  }, [api, slides.length, slides.join('|')]);

  const markFailed = (url:string) => setFailed(prev => {
    if (prev.has(url)) return prev;
    const next = new Set(prev);
    next.add(url);
    return next;
  });

  const active = slides[selected] || slides[0] || recoveryFallback || null;
  const safeZoom = Math.min(Math.max(Number(zoom) || 1, .82), 1.08);

  return <div className="product-gallery-v86-real">
    <div className="product-gallery-v86-stage">
      <div ref={viewportRef} className="product-gallery-v86-viewport">
        <div className="product-gallery-v86-track">
          {(slides.length ? slides : [recoveryFallback].filter(Boolean) as string[]).map((src, index) =>
            <div className="product-gallery-v86-slide" key={src}>
              <div className="product-gallery-v86-blur" aria-hidden="true">
                <img src={src} alt="" />
              </div>
              <motion.div className="product-gallery-v86-product" initial={{opacity:.55}} animate={{opacity:1}}>
                <ProductImage
                  src={src}
                  alt={index ? name + ' · foto ' + (index + 1) : name}
                  categoryName={categoryName}
                  zoom={safeZoom}
                  positionX={positionX}
                  positionY={positionY}
                  blendMode={blendMode}
                  onInvalid={() => markFailed(src)}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'low'}
                />
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {slides.length > 1 && <>
        <button className="product-gallery-v86-arrow is-left" type="button" onClick={()=>api?.scrollPrev()} aria-label="Imagen anterior"><ChevronLeft size={22}/></button>
        <button className="product-gallery-v86-arrow is-right" type="button" onClick={()=>api?.scrollNext()} aria-label="Imagen siguiente"><ChevronRight size={22}/></button>
        <div className="product-gallery-v86-counter">{selected + 1} / {slides.length}</div>
        <div className="product-gallery-v86-thumbs">
          {slides.map((src,index)=><button type="button" key={src} onClick={()=>api?.scrollTo(index)} className={selected===index?'is-active':''} aria-label={'Ver imagen '+(index+1)}>
            <ProductImage src={src} alt="" empty="none" loading="lazy" fetchPriority="low" onInvalid={()=>markFailed(src)}/>
          </button>)}
        </div>
      </>}

      {active && <button className="product-gallery-v86-expand" type="button" onClick={()=>setZoomed(true)}><Maximize2 size={15}/><span>Ver grande</span></button>}
    </div>

    <AnimatePresence>{zoomed && active && <motion.div className="product-gallery-v86-lightbox" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setZoomed(false)}>
      <button type="button" className="product-gallery-v86-close" onClick={()=>setZoomed(false)} aria-label="Cerrar"><X size={21}/></button>
      <div className="product-gallery-v86-lightbox-image" onClick={e=>e.stopPropagation()}>
        <ProductImage src={active} alt={name} zoom={1} positionX={50} positionY={50} blendMode="normal"/>
      </div>
    </motion.div>}</AnimatePresence>
  </div>;
}
