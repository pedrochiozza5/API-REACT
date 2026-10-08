import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/lib/types';
import { money } from '@/lib/format';
import { useCart } from '@/store/cart';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { ProductImage } from './ProductImage';

export function QuickVariantSelector({ product, open, onOpenChange }: { product: Product; open: boolean; onOpenChange: (open:boolean)=>void }) {
  const variants = useMemo(() => (product.variants || []).filter((v) => Boolean(v.active)), [product.variants]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const add = useCart((s) => s.add);
  const selected = variants.find((v) => v.id === selectedId) || null;
  const sold = selected ? Boolean(selected.trackStock) && Number(selected.stockQty) <= 0 : false;
  const price = Number(selected?.price ?? product.price);
  const image = selected?.imageUrl || product.imageUrl || product.images?.[0]?.imageUrl || null;
  const zoom = Number(selected?.imageZoom ?? product.imageZoom ?? 1.08);
  const positionX = Number(selected?.imagePositionX ?? product.imagePositionX ?? 50);
  const positionY = Number(selected?.imagePositionY ?? product.imagePositionY ?? 50);
  const blendMode = selected?.imageBlendMode ?? product.imageBlendMode ?? 'normal';

  function confirm() {
    if (!selected) return toast.error('Elegí una variante.');
    if (sold) return toast.error('Esa variante está agotada.');
    add(product, 1, selected);
    toast.success(`${product.name} · ${selected.value} agregado`);
    onOpenChange(false);
  }

  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent className="flex flex-col overflow-hidden bg-[#f7f3e9] sm:max-w-[500px]">
      <div className="border-b border-black/8 px-5 pb-5 pt-6 pr-16 sm:px-7 sm:pt-7">
        <div className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-black/35">Elegí tu variante</div>
        <SheetTitle className="mt-2 text-3xl font-black tracking-[-.05em]">{product.name}</SheetTitle>
        <SheetDescription className="mt-2 text-xs font-semibold text-black/40">Cada opción mantiene su propio stock, imagen y SKU.</SheetDescription>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
        <motion.div key={selected?.id || 'base'} initial={{ opacity: .65, scale: .985 }} animate={{ opacity: 1, scale: 1 }} className="aspect-square overflow-hidden rounded-[28px] border border-black/7 bg-[#f5f2ea] shadow-sm">
          <ProductImage src={image} fallbackSrc={product.imageUrl || product.images?.[0]?.imageUrl || null} alt={product.name} categoryName={product.categoryName} zoom={zoom} positionX={positionX} positionY={positionY} blendMode={blendMode}/>
        </motion.div>
        <div className="mt-5 grid gap-2">
          {variants.map((variant) => {
            const out = Boolean(variant.trackStock) && Number(variant.stockQty) <= 0;
            return <button key={variant.id} type="button" disabled={out} onClick={() => setSelectedId(variant.id)} className={`flex min-h-14 items-center gap-3 rounded-[18px] border px-4 text-left transition ${selectedId === variant.id ? 'border-[#153f2f] bg-white shadow-sm' : 'border-black/7 bg-white/50'} ${out ? 'cursor-not-allowed opacity-40' : ''}`}>
              <span className="h-7 w-7 shrink-0 rounded-full border-2 border-white shadow ring-1 ring-black/10" style={{ background: variant.colorHex || '#d8d0bf' }}/>
              <span className="min-w-0 flex-1"><span className="block text-xs font-black">{variant.value}</span><span className="mt-0.5 block text-[9px] font-semibold text-black/35">{out ? 'Agotado' : !Boolean(variant.trackStock) ? `Disponible · ${variant.sku}` : Number(variant.stockQty) <= 3 ? `Últimas ${variant.stockQty}` : `Disponible · ${variant.sku}`}</span></span>
              <span className="text-xs font-black">{money(Number(variant.price ?? product.price))}</span>
            </button>;
          })}
        </div>
      </div>
      <div className="border-t border-black/8 bg-[#fbf8f1] px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-7 sm:pb-6">
        <button type="button" disabled={!selected || sold} onClick={confirm} className="flex h-14 w-full items-center justify-between rounded-[18px] bg-[#153f2f] px-5 text-white disabled:opacity-35"><span className="text-sm font-black">Agregar a la ronda</span><span className="flex items-center gap-2 text-sm font-black">{money(price)} <ShoppingBag size={17}/></span></button>
      </div>
    </SheetContent>
  </Sheet>;
}
