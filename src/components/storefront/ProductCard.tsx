import { Check, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Product, ProductVariant } from '@/lib/types';
import { money } from '@/lib/format';
import { legacyProductImage } from '@/lib/productImages';
import { useCart } from '@/store/cart';
import { ProductImage } from './ProductImage';
import { apiGet } from '@/lib/api';

export function ProductCard({ product }: { product: Product }) {
  const add = useCart(state => state.add);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const variants = useMemo(
    () => (product.variants || [])
      .filter(variant => Boolean(variant.active))
      .sort((a,b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)),
    [product.variants],
  );

  const [preview,setPreview] = useState<ProductVariant|null>(
    variants.find(variant => !variant.trackStock || Number(variant.stockQty) > 0) || variants[0] || null,
  );
  const [mediaIndex,setMediaIndex] = useState(0);
  const [justAdded,setJustAdded] = useState(false);

  useEffect(() => {
    setPreview(current =>
      variants.find(variant => variant.id === current?.id)
      || variants.find(variant => !variant.trackStock || Number(variant.stockQty) > 0)
      || variants[0]
      || null,
    );
  }, [product.id, variants]);

  const stock = variants.length
    ? variants.reduce((sum,variant) => sum + Number(variant.stockQty || 0), 0)
    : Number(product.stockQty);

  const sold = product.hasVariants && variants.length === 0
    ? true
    : variants.length
      ? variants.every(variant => Boolean(variant.trackStock) && Number(variant.stockQty) <= 0)
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
      ...(preview?.images || []).map(image => image.imageUrl),
      ...(product.images || []).map(image => image.imageUrl),
    ].filter((url):url is string => Boolean(url))));
    return actual.length ? actual : [legacyPrimary].filter((url):url is string => Boolean(url));
  }, [preview, product.imageUrl, product.images, legacyPrimary]);

  useEffect(() => setMediaIndex(0), [product.id, preview?.id, media.length]);
  useEffect(()=>{if(!justAdded)return;const timer=window.setTimeout(()=>setJustAdded(false),900);return()=>window.clearTimeout(timer);},[justAdded]);

  const primary = media[mediaIndex] || media[0] || legacyPrimary;
  const zoom = Math.min(Number(preview?.imageZoom ?? product.imageZoom ?? 1.03), 1.03);
  const positionX = Number(preview?.imagePositionX ?? product.imagePositionX ?? 50);
  const positionY = Number(preview?.imagePositionY ?? product.imagePositionY ?? 50);
  const blendMode = preview?.imageBlendMode ?? product.imageBlendMode ?? 'normal';

  function prefetchDetail() {
    queryClient.prefetchQuery({
      queryKey:['product',product.slug],
      queryFn:()=>apiGet<Product>(`/api/products/${encodeURIComponent(product.slug)}`),
      staleTime:2*60_000,
    });
  }

  function quickAdd() {
    if (sold) return;
    if (variants.length > 1) {
      prefetchDetail();
      navigate(`/producto/${product.slug}`);
      return;
    }
    if (variants.length === 1) {
      const only=variants[0];
      if (Boolean(only.trackStock) && Number(only.stockQty) <= 0) return;
      add(product,1,only);
      setJustAdded(true);
      return;
    }
    if (product.hasVariants) {
      navigate(`/producto/${product.slug}`);
      return;
    }
    add(product,1,null);
    setJustAdded(true);
  }

  function previousMedia() {
    setMediaIndex(index => (index - 1 + media.length) % media.length);
  }
  function nextMedia() {
    setMediaIndex(index => (index + 1) % media.length);
  }

  return <article
    onMouseEnter={prefetchDetail}
    onFocus={prefetchDetail}
    className="product-card-v5 group min-w-0 overflow-hidden"
  >
    <div className="relative aspect-square overflow-hidden bg-[#f5f2ea]">
      <Link
        to={`/producto/${product.slug}`}
        aria-label={`Ver ${product.name}`}
        className="absolute inset-0 z-0 block"
      >
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
      </Link>

      {media.length > 1 && <>
        <button
          type="button"
          aria-label="Imagen anterior"
          onClick={previousMedia}
          className="absolute left-2 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-[#fbf8f1]/94 text-[#173429] shadow-sm backdrop-blur-sm transition sm:h-9 sm:w-9 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        ><ChevronLeft size={16}/></button>
        <button
          type="button"
          aria-label="Imagen siguiente"
          onClick={nextMedia}
          className="absolute right-2 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-[#fbf8f1]/94 text-[#173429] shadow-sm backdrop-blur-sm transition sm:h-9 sm:w-9 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        ><ChevronRight size={16}/></button>
        <div className="pointer-events-none absolute inset-x-0 bottom-2 z-20 flex justify-center gap-1.5" aria-hidden="true">
          {media.map((_,index)=><span key={index} className={`h-1.5 rounded-full transition-all ${index===mediaIndex?'w-5 bg-[#173e2e]':'w-1.5 bg-[#173e2e]/30'}`}/>)}
        </div>
      </>}

      <div className="pointer-events-none absolute left-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2">
        {hasDiscount && <span className="product-offer-badge">-{discount}%</span>}
        <span className="rounded-full border border-white/45 bg-[#f9f6ee]/94 px-2.5 py-1.5 font-mono-ui text-[7px] font-bold uppercase tracking-[.12em] text-black/55 backdrop-blur-md">{product.categoryName || 'Producto'}</span>
      </div>

      {sold && <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-[#f7f2e8]/72 backdrop-blur-[2px]"><span className="rounded-full bg-[#111713] px-4 py-2 text-[9px] font-black text-white">SIN STOCK</span></div>}
    </div>

    <div className="flex min-h-[142px] flex-col p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link to={`/producto/${product.slug}`} className="block min-h-[2.25rem] line-clamp-2 text-[13px] font-black leading-tight tracking-[-.025em] transition hover:text-[#174a36]">{product.name}</Link>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <div className="text-[16px] font-black tracking-[-.025em] text-[#172119]">{money(price)}</div>
            {hasDiscount && <div className="text-[10px] font-bold text-black/35 line-through">{money(compare)}</div>}
            {hasDiscount && <span className="text-[8px] font-black uppercase tracking-[.08em] text-[#a9472c]">-{discount}%</span>}
          </div>
        </div>

        <button
          type="button"
          disabled={sold}
          onClick={quickAdd}
          className="store-primary-button grid h-11 w-11 shrink-0 place-items-center rounded-[14px]"
          aria-label={variants.length>1?`Elegir opción de ${product.name}`:`Agregar ${product.name}`}
        >{justAdded?<Check size={17}/>:<Plus size={17}/>}</button>
      </div>

      <div className="mt-auto min-h-10 pt-3">
        {variants.length > 0 && <div className="flex flex-wrap items-center gap-1.5">
          {variants.slice(0,4).map(variant => {
            const out=Boolean(variant.trackStock)&&Number(variant.stockQty)<=0;
            return <button
              type="button"
              key={variant.id}
              title={`${variant.value}${out?' · Agotado':''}`}
              disabled={out}
              onClick={()=>setPreview(variant)}
              className={`relative grid h-10 w-10 place-items-center rounded-full transition sm:h-8 sm:w-8 ${preview?.id===variant.id?'ring-2 ring-[#174a36]/65':'ring-1 ring-black/10'} ${out?'opacity-35':''}`}
              aria-label={`Vista ${variant.value}`}
            ><span className="h-5 w-5 rounded-full border border-white shadow-sm" style={{background:variant.colorHex||'#ddd'}}/></button>;
          })}
          {variants.length>4&&<span className="px-1 text-[9px] font-black text-black/35">+{variants.length-4}</span>}
        </div>}
      </div>
    </div>
  </article>;
}
