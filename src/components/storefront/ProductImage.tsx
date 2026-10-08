import { PackageOpen } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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

export function ProductImage({
  src,
  fallbackSrc,
  alt,
  categoryName,
  zoom = 1.08,
  positionX = 50,
  positionY = 50,
  blendMode = 'normal',
  className,
  imageClassName,
  placeholderClassName,
  empty = 'placeholder',
  onInvalid,
  onLoaded,
  loading = 'lazy',
  fetchPriority = 'auto',
  decoding = 'async',
}: Props) {
  const candidates = useMemo(
    () => Array.from(new Set([src, fallbackSrc].filter((value): value is string => Boolean(value?.trim())))),
    [src, fallbackSrc],
  );
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIndex(0);
    setFailed(false);
  }, [src, fallbackSrc]);

  const current = candidates[candidateIndex] || null;
  const safeZoom = clamp(Number(zoom) || 1.08, 0.8, 1.4);
  const safeX = clamp(Number(positionX) || 50, 0, 100);
  const safeY = clamp(Number(positionY) || 50, 0, 100);
  const safeBlend: ProductImageBlend = blendMode === 'multiply' ? 'multiply' : 'normal';

  function fail() {
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex((index) => index + 1);
      return;
    }
    if (current) onInvalid?.(current);
    setFailed(true);
  }

  if (!current || failed) {
    if (empty === 'none') return null;
    return (
      <div className={cn('grid h-full w-full place-items-center overflow-hidden bg-[#f5f2ea]', className)}>
        <div className={cn('flex max-w-[70%] flex-col items-center text-center text-[#183426]/34', placeholderClassName)}>
          <PackageOpen size={28} strokeWidth={1.5} />
          <div className="mt-2 font-mono-ui text-[7px] font-bold uppercase tracking-[.18em]">{categoryName || 'Producto'}</div>
          <div className="mt-1 text-[10px] font-black">Foto pendiente</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-[#f5f2ea]', className)}>
      <img
        src={current}
        alt={alt}
        draggable={false}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding={decoding}
        onError={fail}
        onLoad={() => onLoaded?.(current)}
        className={cn('absolute inset-0 h-full w-full select-none object-contain transition-[transform,opacity] duration-300 ease-out', imageClassName)}
        style={{
          objectPosition: `${safeX}% ${safeY}%`,
          transform: `scale(${safeZoom})`,
          mixBlendMode: safeBlend,
        }}
      />
    </div>
  );
}
