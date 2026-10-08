import { useCallback, useEffect, useMemo, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
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
  const normalized = useMemo(() => {
    const urls = [fallback, ...images.map((image) => image.imageUrl)]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value));
    return Array.from(new Set(urls));
  }, [images, fallback]);

  // Mantener contain: la foto completa siempre. El ancho lo da el viewport, no un crop.
  const galleryZoom = Math.min(Math.max(Number(zoom) || 1, 0.8), 1.03);
  const [invalid, setInvalid] = useState<Set<string>>(() => new Set());
  const valid = useMemo(() => normalized.filter((url) => !invalid.has(url)), [normalized, invalid]);
  const [emblaRef, api] = useEmblaCarousel({ loop: valid.length > 1, align: 'start', skipSnaps: false });
  const [index, setIndex] = useState(0);
  const onSelect = useCallback(() => setIndex(api?.selectedScrollSnap() || 0), [api]);

  useEffect(() => setInvalid(new Set()), [normalized.join('|')]);

  useEffect(() => {
    if (!api) return;
    onSelect();
    api.on('select', onSelect);
    api.on('reInit', onSelect);
    return () => {
      api.off('select', onSelect);
      api.off('reInit', onSelect);
    };
  }, [api, onSelect]);

  useEffect(() => {
    if (!api) return;
    api.reInit({ loop: valid.length > 1, align: 'start', skipSnaps: false });
    api.scrollTo(0, true);
    setIndex(0);
  }, [api, valid.length, normalized.join('|')]);

  function markInvalid(src: string) {
    setInvalid((current) => {
      const next = new Set(current);
      next.add(src);
      return next;
    });
  }

  if (!valid.length) {
    return (
      <div className="product-gallery-v85 w-full min-w-0 overflow-hidden bg-[#f3efe6]">
        <div className="aspect-square sm:aspect-[5/4] lg:aspect-[4/3]">
          <ProductImage
            src={recoveryFallback}
            alt={name}
            categoryName={categoryName}
            zoom={1}
            onInvalid={markInvalid}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="product-gallery-v85 w-full min-w-0">
      <div className="group/gallery product-gallery-stage-v85 relative w-full bg-[#f3efe6]">
        <div ref={emblaRef} className="product-gallery-viewport-v85">
          <div className="product-gallery-track-v85">
            {valid.map((src, imageIndex) => (
              <div key={src} className="product-gallery-slide-v85">
                <div className="product-gallery-frame-v85">
                  <motion.div
                    key={src}
                    initial={{ opacity: .45 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: .24 }}
                    className="h-full w-full"
                  >
                    <ProductImage
                      src={src}
                      fallbackSrc={imageIndex === 0 ? recoveryFallback : null}
                      alt={imageIndex === 0 ? name : `${name} · foto ${imageIndex + 1}`}
                      categoryName={categoryName}
                      zoom={galleryZoom}
                      positionX={positionX}
                      positionY={positionY}
                      blendMode={blendMode}
                      onInvalid={markInvalid}
                      loading={imageIndex === 0 ? 'eager' : 'lazy'}
                      fetchPriority={imageIndex === 0 ? 'high' : 'low'}
                    />
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {valid.length > 1 && (
          <>
            <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5 sm:hidden">
              {valid.map((src, dotIndex) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => api?.scrollTo(dotIndex)}
                  className={`pointer-events-auto h-1.5 rounded-full transition-all ${dotIndex === index ? 'w-6 bg-[#172119]' : 'w-1.5 bg-[#172119]/25'}`}
                  aria-label={`Ir a foto ${dotIndex + 1}`}
                />
              ))}
            </div>

            <div className="pointer-events-none absolute inset-x-4 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-between sm:flex">
              <button type="button" onClick={() => api?.scrollPrev()} className="store-icon-button pointer-events-auto opacity-0 transition group-hover/gallery:opacity-100 focus:opacity-100" aria-label="Foto anterior"><ArrowLeft size={17}/></button>
              <button type="button" onClick={() => api?.scrollNext()} className="store-icon-button pointer-events-auto opacity-0 transition group-hover/gallery:opacity-100 focus:opacity-100" aria-label="Foto siguiente"><ArrowRight size={17}/></button>
            </div>
          </>
        )}
      </div>

      {valid.length > 1 && (
        <div className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:px-0">
          {valid.map((src, thumbIndex) => (
            <button
              key={src}
              type="button"
              onClick={() => api?.scrollTo(thumbIndex)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-[12px] border bg-[#f5f2ea] transition sm:h-[72px] sm:w-[72px] ${thumbIndex === index ? 'border-[#173b2d] bg-white' : 'border-black/[.07] hover:border-black/20'}`}
              aria-label={`Imagen ${thumbIndex + 1}`}
            >
              <ProductImage src={src} alt="" zoom={galleryZoom} positionX={positionX} positionY={positionY} blendMode={blendMode} empty="none" onInvalid={markInvalid} loading="lazy" fetchPriority="low"/>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
