import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, Minus, Plus, ShoppingBag } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { ProductGallery } from '@/components/storefront/ProductGallery';
import { BrandGlyph } from '@/components/storefront/BrandGlyph';
import { StoreBackdrop } from '@/components/storefront/StoreBackdrop';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/lib/api';
import { money } from '@/lib/format';
import { legacyProductImage } from '@/lib/productImages';
import type { Product, ProductImage, ProductVariant } from '@/lib/types';
import { useCart } from '@/store/cart';

export function ProductPage() {
  const { slug = '' } = useParams();
  const reduceMotion = useReducedMotion();
  const [qty, setQty] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [added, setAdded] = useState(false);
  const add = useCart(state => state.add);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: ({ signal }) => apiGet<Product>(`/api/products/${encodeURIComponent(slug)}`, signal),
    staleTime: 2 * 60_000,
  });

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 1000);
    return () => window.clearTimeout(timer);
  }, [added]);

  useEffect(() => {
    if (!product) return;

    const brandName = product.brandId === 'amargos' ? 'Bien Amargos' : 'Bien Yerbados';
    const canonicalUrl = `https://bienamargos.com.ar/producto/${product.slug}`;
    const title = product.seoTitle || `${product.name} | ${brandName}`;
    const description = product.seoDescription || product.shortDescription || product.description || `${product.name} en ${brandName}.`;
    const absolute = (value?: string | null) => value ? new URL(value, 'https://bienamargos.com.ar').toString() : '';
    const image = absolute(product.imageUrl) || 'https://bienamargos.com.ar/brand/bien-amargos-mark.png';

    const ensureMeta = (selector: string, attrs: Record<string, string>) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        document.head.appendChild(element);
      }
      Object.entries(attrs).forEach(([key, value]) => element!.setAttribute(key, value));
      return element;
    };

    document.title = title;
    ensureMeta('meta[name="description"]', { name: 'description', content: description });
    ensureMeta('meta[name="robots"]', { name: 'robots', content: 'index,follow,max-image-preview:large' });
    ensureMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    ensureMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    ensureMeta('meta[property="og:type"]', { property: 'og:type', content: 'product' });
    ensureMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    ensureMeta('meta[property="og:image"]', { property: 'og:image', content: image });
    ensureMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    ensureMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    ensureMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    ensureMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image });

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    const activeVariants = (product.variants || []).filter(variant => Boolean(variant.active));
    const offer = (price: number, stock: number, track: boolean) => ({
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'ARS',
      price: Number(price),
      availability: !track || stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Bien Amargos' },
    });
    const brand = { '@type': 'Brand', name: brandName };
    const structuredImages = [product.imageUrl, ...(product.images || []).map(item => item.imageUrl)]
      .filter(Boolean)
      .map(value => absolute(String(value)));

    const structured = activeVariants.length
      ? {
          '@context': 'https://schema.org',
          '@type': 'ProductGroup',
          name: product.name,
          description,
          brand,
          url: canonicalUrl,
          productGroupID: String(product.sku || product.id),
          ...(structuredImages.length ? { image: structuredImages } : {}),
          hasVariant: activeVariants.map(variant => ({
            '@type': 'Product',
            name: `${product.name} — ${variant.value}`,
            sku: variant.sku,
            brand,
            url: canonicalUrl,
            ...((variant.imageUrl || product.imageUrl) ? { image: [absolute(variant.imageUrl || product.imageUrl)] } : {}),
            offers: offer(Number(variant.price ?? product.price), Number(variant.stockQty || 0), Boolean(variant.trackStock)),
          })),
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description,
          sku: product.sku,
          brand,
          url: canonicalUrl,
          ...(structuredImages.length ? { image: structuredImages } : {}),
          offers: offer(Number(product.price), Number(product.stockQty || 0), Boolean(product.trackStock)),
        };

    let script = document.getElementById('seo-jsonld') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'seo-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.text = JSON.stringify(structured).replace(/</g, '\\u003c');
    return () => script?.remove();
  }, [product]);

  const variants = useMemo(
    () => (product?.variants || [])
      .filter(variant => Boolean(variant.active))
      .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)),
    [product],
  );

  useEffect(() => {
    setSelectedId(variants.length === 1 ? variants[0].id : null);
    setQty(1);
  }, [product?.id, variants.length]);

  const selected: ProductVariant | null = variants.find(variant => variant.id === selectedId) || null;
  const brand = product?.brandId || 'amargos';
  const yerbados = brand === 'enyerbados';
  const stock = Number(selected ? selected.stockQty : variants.length ? 0 : product?.stockQty || 0);
  const trackStock = selected ? Boolean(selected.trackStock) : variants.length ? true : Boolean(product?.trackStock);
  const soldOut = selected
    ? trackStock && stock <= 0
    : product?.hasVariants && variants.length === 0
      ? true
      : variants.length
        ? false
        : trackStock && stock <= 0;

  const price = Number(selected?.price ?? product?.price ?? 0);
  const compare = Number(selected?.compareAtPrice ?? product?.compareAtPrice ?? 0);
  const hasDiscount = compare > price && price >= 0;
  const discount = hasDiscount ? Math.max(1, Math.round((1 - price / compare) * 100)) : 0;

  const gallery = useMemo<ProductImage[]>(() => {
    if (!product) return [];
    const primary = selected?.imageUrl || product.imageUrl || '';
    const all = [...(selected?.images || []), ...(product.images || [])];
    const seen = new Set<string>();
    return all.filter(image => {
      const url = String(image?.imageUrl || '').trim();
      if (!url || url === primary || seen.has(url)) return false;
      seen.add(url);
      return true;
    });
  }, [product, selected]);

  const fallback = selected?.imageUrl || product?.imageUrl || gallery[0]?.imageUrl || null;
  const recoveryFallback = product ? legacyProductImage(product) : null;
  const imageZoom = Number(selected?.imageZoom ?? product?.imageZoom ?? 1);
  const imagePositionX = Number(selected?.imagePositionX ?? product?.imagePositionX ?? 50);
  const imagePositionY = Number(selected?.imagePositionY ?? product?.imagePositionY ?? 50);
  const imageBlendMode = selected?.imageBlendMode ?? product?.imageBlendMode ?? 'normal';
  const maxQty = trackStock ? Math.max(stock, 1) : 30;
  const canAdd = !!product && (!product.hasVariants || !!selected) && !soldOut;

  function addCurrent() {
    if (!product) return;
    if (variants.length && !selected) return toast.error('Elegí una variante antes de agregar.');
    if (soldOut) return toast.error('Esa opción está agotada.');
    add(product, qty, selected);
    setAdded(true);
  }

  if (isLoading) return <main className="storefront-page storefront-page--green min-h-screen overflow-hidden pt-[96px]">
    <StoreBackdrop brand="amargos" />
    <div className="storefront-content">
      <Header brand="amargos" solid hideMobileDock />
      <div className="h-[68svh] min-h-[440px] w-full animate-pulse bg-white/20 lg:h-[calc(100svh-96px)]" />
    </div>
  </main>;

  if (error || !product) return <main className="storefront-page storefront-page--green min-h-screen pt-[96px]">
    <StoreBackdrop brand="amargos" />
    <div className="storefront-content">
      <Header brand="amargos" solid hideMobileDock />
      <section className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-5 text-center">
        <div className="rounded-[28px] border border-white/45 bg-[#fbf8f1]/88 p-8 backdrop-blur-md">
          <h1 className="text-4xl font-black tracking-[-.05em]">Producto no encontrado</h1>
          <Button asChild className="mt-5"><Link to="/catalogo">Volver a la tienda</Link></Button>
        </div>
      </section>
    </div>
  </main>;

  return <main className={`storefront-page ${yerbados ? 'storefront-page--yellow' : 'storefront-page--green'} min-h-screen overflow-x-hidden pt-[96px] sm:pt-[108px]`}>
    <StoreBackdrop brand={brand} />
    <div className="storefront-content">
      <Header brand={brand} solid hideMobileDock />

      <section className="relative w-screen">
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

        <Link
          to={`/catalogo?brand=${brand}`}
          className="absolute left-3 top-3 z-30 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/55 bg-[#fbf8f1]/88 px-4 text-[10px] font-black text-[#173429] backdrop-blur-md transition duration-200 hover:-translate-y-px hover:bg-white sm:left-5 sm:top-5"
        ><ArrowLeft size={14} /> Tienda</Link>

        <motion.aside
          initial={reduceMotion ? false : { opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reduceMotion ? 0 : .38, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-30 border-t border-black/[.07] bg-[#fbf8f1]/94 px-4 py-7 sm:px-6 lg:absolute lg:inset-y-0 lg:right-0 lg:block lg:w-[405px] lg:overflow-y-auto lg:border-l lg:border-t-0 lg:border-white/45 lg:bg-[#fbf8f1]/86 lg:px-7 lg:py-8 lg:backdrop-blur-md xl:w-[430px] xl:px-8"
        >
          <div className="mx-auto w-full max-w-[560px] lg:mx-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 font-mono-ui text-[8px] font-semibold uppercase tracking-[.18em] text-black/42">
                <BrandGlyph kind={yerbados ? 'yerba' : 'mate'} className="h-4 w-4" />
                {yerbados ? 'Bien Yerbados' : 'Bien Amargos'} · {product.categoryName || 'Selección'}
              </div>
              {hasDiscount && <span className="rounded-full bg-[#a9472c] px-2.5 py-1 text-[8px] font-black text-white">-{discount}%</span>}
            </div>

            <h1 className="mt-3 max-w-[13ch] text-[clamp(2.4rem,9vw,3.7rem)] font-black leading-[.9] tracking-[-.065em] text-[#172119] lg:text-[clamp(2.35rem,3vw,3.45rem)]">{product.name}</h1>

            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={price}
                  initial={reduceMotion ? false : { opacity: .45, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -3 }}
                  transition={{ duration: reduceMotion ? 0 : .16 }}
                  className="text-[clamp(1.95rem,6vw,2.65rem)] font-black tracking-[-.045em] text-[#172119]"
                >{money(price)}</motion.div>
              </AnimatePresence>
              {hasDiscount && <div className="text-sm font-bold text-black/32 line-through">{money(compare)}</div>}
            </div>
            {hasDiscount && <div className="mt-1 text-[9px] font-black uppercase tracking-[.1em] text-[#a9472c]">Ahorrás {money(compare - price)}</div>}

            {product.shortDescription && <p className="mt-4 max-w-[46ch] text-[13px] font-semibold leading-[1.65] text-black/54">{product.shortDescription}</p>}

            <div className="mt-4 flex flex-wrap items-center gap-2 border-y border-black/[.07] py-3">
              <span className={`inline-flex items-center gap-1.5 text-[9px] font-black ${soldOut ? 'text-red-600' : selected && stock <= 3 ? 'text-amber-700' : 'text-emerald-700'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${soldOut ? 'bg-red-500' : selected && stock <= 3 ? 'bg-amber-500' : 'bg-emerald-600'}`} />
                {soldOut ? 'Agotado' : !trackStock ? 'Disponible' : selected && stock <= 3 ? `Últimas ${stock}` : 'Disponible'}
              </span>
              <span className="h-1 w-1 rounded-full bg-black/15" />
              <span className="font-mono-ui text-[7px] uppercase tracking-[.12em] text-black/28">SKU {selected?.sku || product.sku}</span>
            </div>

            {variants.length > 0 && <div className="mt-5">
              <div>
                <div className="text-[11px] font-black">Elegí {variants[0]?.name?.toLowerCase() || 'variante'}</div>
                <div className="mt-1 text-[9px] font-semibold text-black/36">{selected ? selected.value : 'Seleccioná una opción'}</div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {variants.map(variant => {
                  const out = Boolean(variant.trackStock) && Number(variant.stockQty) <= 0;
                  const active = selected?.id === variant.id;
                  return <motion.button
                    type="button"
                    key={variant.id}
                    disabled={out}
                    whileTap={reduceMotion ? undefined : { scale: .985 }}
                    onClick={() => { setSelectedId(variant.id); setQty(1); }}
                    className={`flex min-h-12 items-center gap-2 rounded-[14px] border px-3 text-left transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174a36]/35 disabled:cursor-not-allowed disabled:opacity-35 ${active ? 'border-[#174a36] bg-[#174a36] text-white' : 'border-black/10 bg-white/58 text-[#172119] hover:border-[#174a36]/30 hover:bg-white/90'}`}
                  >
                    <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-full">
                      <span className="h-5 w-5 rounded-full border border-black/10" style={{ background: variant.colorHex || '#d8d0bf' }} />
                      {active && <Check size={11} className="absolute text-white drop-shadow" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[10px] font-extrabold">{variant.value}</span>
                      <span className={`block text-[7px] font-semibold ${active ? 'text-white/60' : 'text-black/35'}`}>{out ? 'Agotado' : 'Disponible'}</span>
                    </span>
                  </motion.button>;
                })}
              </div>
            </div>}

            <div className="mt-5 hidden gap-2.5 sm:flex">
              <div className="flex h-14 items-center rounded-[14px] border border-black/10 bg-white/58 p-1">
                <button type="button" onClick={() => setQty(current => Math.max(1, current - 1))} className="grid h-11 w-10 place-items-center rounded-xl transition hover:bg-black/[.04]" aria-label="Restar cantidad"><Minus size={15} /></button>
                <span className="min-w-8 text-center text-sm font-black">{qty}</span>
                <button type="button" disabled={!canAdd} onClick={() => setQty(current => Math.min(maxQty, current + 1))} className="grid h-11 w-10 place-items-center rounded-xl transition hover:bg-black/[.04] disabled:opacity-30" aria-label="Sumar cantidad"><Plus size={15} /></button>
              </div>
              <Button size="lg" disabled={!canAdd} onClick={addCurrent} className="h-14 min-w-0 flex-1 overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={added ? 'added' : 'add'} initial={reduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -5 }} transition={{ duration: reduceMotion ? 0 : .15 }} className="inline-flex items-center gap-2">
                    {added ? <><Check size={17} /> Agregado</> : <><ShoppingBag size={17} />{variants.length && !selected ? 'Elegí una opción' : soldOut ? 'Sin stock' : 'Agregar'}</>}
                  </motion.span>
                </AnimatePresence>
              </Button>
            </div>

            <div className="mt-5 grid gap-2 border-t border-black/[.07] pt-4">
              <details className="group border-b border-black/[.07] py-3">
                <summary className="cursor-pointer list-none text-[10px] font-black">Detalle <span className="float-right text-black/30 transition group-open:rotate-45">+</span></summary>
                <p className="pt-3 text-[12px] leading-[1.65] text-black/50">{product.description || product.shortDescription || 'Selección de la casa.'}</p>
              </details>
              <details className="group border-b border-black/[.07] py-3">
                <summary className="cursor-pointer list-none text-[10px] font-black">Entrega <span className="float-right text-black/30 transition group-open:rotate-45">+</span></summary>
                <p className="pt-3 text-[12px] leading-[1.65] text-black/50">Envíos a todo el país y retiro coordinado. La compra se termina de confirmar por WhatsApp.</p>
              </details>
            </div>
          </div>
        </motion.aside>
      </section>

      <Footer brand={brand} />
    </div>

    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-black/8 bg-[#fbf8f1]/96 p-2.5 pb-[calc(.65rem+env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-2">
        <div className="flex h-[50px] items-center rounded-[14px] border border-black/10 bg-white/70 p-1">
          <button type="button" onClick={() => setQty(current => Math.max(1, current - 1))} className="grid h-10 w-9 place-items-center rounded-xl" aria-label="Restar cantidad"><Minus size={14} /></button>
          <span className="min-w-6 text-center text-xs font-black">{qty}</span>
          <button type="button" disabled={!canAdd} onClick={() => setQty(current => Math.min(maxQty, current + 1))} className="grid h-10 w-9 place-items-center rounded-xl disabled:opacity-30" aria-label="Sumar cantidad"><Plus size={14} /></button>
        </div>
        <button
          type="button"
          disabled={!canAdd}
          onClick={addCurrent}
          className={`flex h-[50px] flex-1 items-center justify-between rounded-[14px] px-4 text-white transition duration-150 active:scale-[.99] disabled:opacity-40 ${added ? 'bg-[#197348]' : 'bg-[#173e2e]'}`}
        >
          <span className="inline-flex items-center gap-2 text-[10px] font-black">{added && <Check size={15} />}{added ? 'Agregado' : variants.length && !selected ? 'Elegí opción' : soldOut ? 'Sin stock' : 'Agregar'}</span>
          <span className="text-[11px] font-black">{money(price * qty)}</span>
        </button>
      </div>
    </div>
  </main>;
}
