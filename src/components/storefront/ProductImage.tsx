import { PackageOpen } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

export type ProductImageBlend = 'normal' | 'multiply';

type Props = {
  src?: string | null;
  fallbackSrc?: string | null;
  alt: string;
  categoryName?: string | null;
  zoom?: number | null;
  positionX?: number | null;
  positionY?: number | null;
  blendMode?: ProductImageBlend | string | null;
  className?: string;
  imageClassName?: string;
  placeholderClassName?: string;
  empty?: 'placeholder' | 'none';
  onInvalid?: (src: string) => void;
  onLoaded?: (src: string) => void;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
  decoding?: 'sync' | 'async' | 'auto';
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Each URL-set owns its own failed candidates. The former implementation hid
 * <img> with opacity-0 until onLoad, then reset loaded=false in an effect.
 * If an already-cached image fired onLoad before that effect, it stayed white.
 * Images are ALWAYS visible; their request lifecycle never controls opacity.
 */
export function ProductImage(props: Props) {
  const candidates = useMemo(() => Array.from(new Set(
    [props.src, props.fallbackSrc]
      .map(value => String(value || '').trim())
      .filter(Boolean),
  )), [props.src, props.fallbackSrc]);

  return <ImageCandidates
    key={JSON.stringify(candidates)}
    {...props}
    candidates={candidates}
  />;
}

function ImageCandidates({
  candidates, alt, categoryName, zoom = 1.08, positionX = 50,
  positionY = 50, blendMode = 'normal', className, imageClassName,
  placeholderClassName, empty = 'placeholder', onInvalid, onLoaded,
  loading = 'lazy', fetchPriority = 'auto', decoding = 'async',
}: Props & { candidates: string[] }) {
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const imgRef = useRef<HTMLImageElement>(null);
  const notified = useRef<Set<string>>(new Set());
  const current = candidates.find(url => !failed.has(url)) || null;

  const safeZoom = clamp(Number(zoom) || 1.08, 0.8, 1.4);
  const safeX = clamp(Number(positionX ?? 50), 0, 100);
  const safeY = clamp(Number(positionY ?? 50), 0, 100);
  const safeBlend: ProductImageBlend = blendMode === 'multiply' ? 'multiply' : 'normal';

  // Cached images can complete before React attaches onLoad. This effect may
  // announce a successful cached load, but is NEVER used to make it visible.
  useEffect(() => {
    const node = imgRef.current;
    if (!current || !node || !node.complete || node.naturalWidth === 0) return;
    if (!notified.current.has(current)) {
      notified.current.add(current);
      onLoaded?.(current);
    }
  }, [current, onLoaded]);

  function handleError(url: string) {
    if (url !== current) return; // Ignore an obsolete request after a switch.
    setFailed(previous => new Set(previous).add(url));
    if (!candidates.some(candidate => candidate !== url && !failed.has(candidate))) {
      onInvalid?.(url);
    }
  }

  if (!current) {
    if (empty === 'none') return null;
    return <div className={cn('grid h-full w-full place-items-center overflow-hidden bg-[#ecebe5]', className)}>
      <div className={cn('flex max-w-[70%] flex-col items-center text-center text-[#183426]/55', placeholderClassName)}>
        <PackageOpen size={28} strokeWidth={1.5} />
        <div className="mt-2 font-mono-ui text-[10px] font-bold uppercase tracking-[.14em]">{categoryName || 'Producto'}</div>
        <div className="mt-1 text-xs font-bold">Imagen no disponible</div>
      </div>
    </div>;
  }

  return <div className={cn('relative h-full w-full overflow-hidden', className)}>+    <img
      ref={imgRef}
      key={current}
      src={current}
      alt={alt}
      draggable={false}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding={decoding}
      onError={() => handleError(current)}
      onLoad={event => {
        if (event.currentTarget.naturalWidth > 0 && !notified.current.has(current)) {
          notified.current.add(current);
          onLoaded?.(current);
        }
      }}
      data-image-url={current}
      className={cn('absolute inset-0 h-full w-full select-none object-contain', imageClassName)}
      style={{
        objectPosition: `${safeX}% ${safeY}%`,
        transform: `scale(${safeZoom})`,
        mixBlendMode: safeBlend,
      }}
    />
  </div>;
}
