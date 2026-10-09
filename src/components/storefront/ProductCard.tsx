import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Product, ProductVariant } from '@/lib/types';
import { money } from '@/lib/format';
import { legacyProductImage } from '@/lib/productImages';
import { useCart } from '@/store/cart';
import { toast } from 'sonner';
import { QuickVariantSelector } from './QuickVariantSelector';
import { ProductImage } from './ProductImage';
import { apiGet } from '@/lib/api';

export function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const queryClient = useQueryClient();
  const variants = useMemo(
    () => (product.variants || []).filter((v) => Boolean(v.active)).sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)),
    [product.variants],
  );
  const [preview, setPreview] = useState<ProductVariant | null>(variants.find((v) => !v.trackStock || Number(v.stockQty) > 0) || variants[0] || null);
  useEffect(() => {
    setPreview((current) => variants.find((variant) => variant.id === current?.id) || variants.find((variant) => !variant.trackStock || Number(variant.stockQty) > 0) || variants[0] || null);
  }, [product.id, variants]);
  const [picker, setPicker] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);

  const stock = variants.length ? variants.reduce((sum, v) => sum + Number(v.stockQty || 0), 0) : Number(product.stockQty);
  const sold = product.hasVariants && variants.length === 0
    ? true
    : variants.length
      ? variants.every((v) => Boolean(v.trackStock) && Number(v.stockQty) <= 0)
      : Boolean(product.trackStock) && stock <= 0;

  const price = Number(preview?.price ?? product.price);
  const compare = Number(preview?.compareAtPrice ?? product.compareAtPrice ?? 0);
  const hasDiscount = compare > price && price >= 0;
  const discount = hasDiscount ? Math.max(1, Math.round((1 - price / compare) * 100)) : 0;

  const legacyPrimary = legacyProductImage(product);
  const media = useMemo(() => {
    const actual = Array.from(new Set([
      preview?.imageUrl,
      product.imageUrl,
      ...(preview?.images || []).map((image) => image.imageUrl),
      ...(product.images || []).map((image) => image.imageUrl),
    ].filter((url): url is string => Boolean(url))));
    return actual.length ? actual : [legacyPrimary].filter((url): url is string => Boolean(url));
  }, [preview, product.imageUrl, product.images, legacyPrimary]);
  useEffect(() => setMediaIndex(0), [product.id, preview?.id, media.length]);
  const primary = media[mediaIndex] || media[0] || legacyPrimary;
  const zoom = Math.min(Number(preview?.imageZoom ?? product.imageZoom ?? 1.03), 1.03);
  const positionX = Number(preview?.imagePositionX ?? product.imagePositionX ?? 50);
  const positionY = Number(preview?.imagePositionY ?? product.imagePositionY ?? 50);
  const blendMode = preview?.imageBlendMode ?? product.imageBlendMode ?? 'normal';

  function prefetchDetail() {
    queryClient.prefetchQuery({
      queryKey: ['product', product.slug],
      queryFn: () => apiGet<Product>(`/api/products/${encodeURIComponent(product.slug)}`),
      staleTime: 2 * 60_000,
    });
  }

  function quick() {
    if (sold) return;
    if (variants.length === 0) {
      if (product.hasVariants) return;
      add(product, 1, null);
      toast.success('Agregado a la ronda.');
      return;
    }
    if (variants.length === 1) {
      const only = variants[0];
      if (Boolean(only.trackStock) && Number(only.stockQty) <= 0) return;
      add(product, 1, only);
      toast.success(`${product.name} · ${only.value} agregado`);
      return;
    }
    setPicker(true);
  }

  return <>
    <article onMouseEnter={prefetchDetail} onFocus={prefetchDetail} className="product-card-v5 group min-w-0 overflow-hidden">
      <Link to={`/producto/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-[#f5f2ea]">
          <ProductImage
            src={primary}
            fallbackSrc={legacyPrimary}
            alt={product.name}
            categoryName={product.categoryName}
            zoom={zoom}
            positionX={positionX}
            positionY={positionY}
            blendMode={blendMode}
            className="absolute inset-0"
            imageClassName="duration-300"
          />
          {media.length > 1 && <>
            <button type="button" aria-label="Imagen anterior" onClick={(event)=>{event.preventDefault();event.stopPropagation();setMediaIndex(index=>(index-1+media.length)%media.length);}} className="absolute left-2 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-[#fbf8f1]/92 text-[#173429] opacity-100 shadow-sm backdrop-blur-sm transition sm:opacity-0 sm:group-hover:opacity-100"><ChevronLeft size={15}/></button>
            <button type="button" aria-label="Imagen siguiente" onClick={(event)=>{event.preventDefault();event.stopPropagation();setMediaIndex(index=>(index+1)%media.length);}} className="absolute right-2 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-[#fbf8f1]/92 text-[#173429] opacity-100 shadow-sm backdrop-blur-sm transition sm:opacity-0 sm:group-hover:opacity-100"><ChevronRight size={15}/></button>
            <div className="absolute inset-x-0 bottom-2 z-20 flex justify-center gap-1.5">{media.map((_,index)=><button type="button" key={index} aria-label={`Ver imagen ${index+1}`} onClick={(event)=>{event.preventDefault();event.stopPropagation();setMediaIndex(index);}} className={`h-1.5 rounded-full transition-all ${index===mediaIndex?'w-5 bg-[#173e2e]':'w-1.5 bg-[#173e2e]/30'}`}/>)}</div>
          </>}

          <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2">
            {hasDiscount && <span className="product-offer-badge">-{discount}% OFF</span>}
            <span className="rounded-full border border-white/45 bg-[#f9f6ee]/94 px-2.5 py-1.5 font-mono-ui text-[7px] font-bold uppercase tracking-[.12em] text-black/55 backdrop-blur-md">{product.categoryName || 'Producto'}</span>
            {variants.length > 0 && <span className="rounded-full bg-[#111713]/86 px-2.5 py-1.5 font-mono-ui text-[7px] font-bold uppercase tracking-[.12em] text-white backdrop-blur-md">{variants.length} variantes</span>}
          </div>
          {sold && <div className="absolute inset-0 z-20 grid place-items-center bg-[#f7f2e8]/72 backdrop-blur-[2px]"><span className="rounded-full bg-[#111713] px-4 py-2 text-[9px] font-black text-white">SIN STOCK</span></div>}
        </div>
      </Link>

      <div className="flex min-h-[146px] flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Link to={`/producto/${product.slug}`} className="block min-h-[2.25rem] line-clamp-2 text-[13px] font-black leading-tight tracking-[-.025em] hover:text-[#174a36]">{product.name}</Link>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <div className="text-[15px] font-black tracking-[-.025em] text-[#172119]">{money(price)}</div>
              {hasDiscount && <div className="text-[10px] font-bold text-black/35 line-through">{money(compare)}</div>}
              {hasDiscount && <span className="text-[8px] font-black uppercase tracking-[.08em] text-[#a34b2d]">Oferta</span>}
            </div>
          </div>
          <button type="button" disabled={sold} onClick={quick} className={`store-primary-button product-card-add-v85 grid h-11 w-11 shrink-0 place-items-center rounded-full ${product.brandId === 'amargos' ? 'store-primary-button--amargos' : 'store-primary-button--yerbados'}`} aria-label={`Agregar ${product.name}`}><Plus size={17}/></button>
        </div>

        <div className="mt-auto min-h-8 pt-3">
          {variants.length > 0 && <div className="flex items-center gap-2">
            {variants.slice(0, 4).map((v) => {
              const out = Boolean(v.trackStock) && Number(v.stockQty) <= 0;
              return <button type="button" key={v.id} title={`${v.value}${out ? ' · Agotado' : ''}`} onClick={() => setPreview(v)} className={`relative grid h-7 w-7 place-items-center rounded-full transition ${preview?.id === v.id ? 'ring-2 ring-[#172119]/55' : 'ring-1 ring-black/10'} ${out ? 'opacity-35' : ''}`}><span className="h-[18px] w-[18px] rounded-full border border-white shadow" style={{ background: v.colorHex || '#ddd' }}/></button>;
            })}
            {variants.length > 4 && <span className="text-[9px] font-black text-black/35">+{variants.length - 4}</span>}
          </div>}
        </div>
      </div>
    </article>
    {variants.length > 1 && <QuickVariantSelector product={product} open={picker} onOpenChange={setPicker}/>}
  </>;
}
