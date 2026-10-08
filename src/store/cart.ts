import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, ProductVariant } from '@/lib/types';

type CartState = {
  items: CartItem[];
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (product: Product, qty?: number, variant?: ProductVariant | null) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
};

export function cartKey(productId: number, variantId?: number | null) {
  return `${productId}:${variantId ?? 0}`;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      open: false,
      setOpen: (open) => set({ open }),
      add: (product, qty = 1, variant = null) => set((state) => {
        const activeVariants = (product.variants || []).filter((v) => Boolean(v.active));
        // A product with variants is never allowed into the cart without the exact variant snapshot.
        if ((product.hasVariants || activeVariants.length > 0) && !variant) return state;
        const stockQty = Number(variant ? variant.stockQty : product.stockQty);
        const tracked = Boolean(variant ? variant.trackStock : product.trackStock);
        if (tracked && stockQty <= 0) return state;
        const safeQty = tracked ? Math.min(Math.max(1, qty), stockQty) : Math.max(1, qty);
        const key = cartKey(product.id, variant?.id);
        const price = Number(variant?.price ?? product.price);
        const current = state.items.find((item) => item.key === key);
        if (current) {
          const nextQty = tracked ? Math.min(current.qty + safeQty, stockQty) : current.qty + safeQty;
          return {
            open: true,
            items: state.items.map((item) => item.key === key
              ? { ...item, qty: nextQty, stockQty, trackStock: tracked, price, imageUrl: variant?.imageUrl || product.imageUrl || item.imageUrl, imageZoom: variant?.imageZoom ?? product.imageZoom ?? item.imageZoom ?? 1.08, imagePositionX: variant?.imagePositionX ?? product.imagePositionX ?? item.imagePositionX ?? 50, imagePositionY: variant?.imagePositionY ?? product.imagePositionY ?? item.imagePositionY ?? 50, imageBlendMode: variant?.imageBlendMode ?? product.imageBlendMode ?? item.imageBlendMode ?? 'normal' }
              : item),
          };
        }
        return {
          open: true,
          items: [...state.items, {
            key,
            productId: product.id,
            variantId: variant?.id ?? null,
            brandId: product.brandId,
            name: product.name,
            slug: product.slug,
            sku: variant?.sku || product.sku,
            price,
            qty: safeQty,
            stockQty,
            trackStock: tracked,
            imageUrl: variant?.imageUrl || product.imageUrl || product.images?.[0]?.imageUrl || null,
            variantName: variant?.name || null,
            variantValue: variant?.value || null,
            variantSku: variant?.sku || null,
            colorHex: variant?.colorHex || null,
            imageZoom: variant?.imageZoom ?? product.imageZoom ?? 1.08,
            imagePositionX: variant?.imagePositionX ?? product.imagePositionX ?? 50,
            imagePositionY: variant?.imagePositionY ?? product.imagePositionY ?? 50,
            imageBlendMode: variant?.imageBlendMode ?? product.imageBlendMode ?? 'normal',
          }],
        };
      }),
      remove: (key) => set((state) => ({ items: state.items.filter((item) => item.key !== key) })),
      setQty: (key, qty) => set((state) => ({
        items: state.items.map((item) => {
          if (item.key !== key) return item;
          const tracked = item.trackStock !== false;
          const max = tracked ? Math.max(1, item.stockQty) : 99;
          return { ...item, qty: Math.max(1, Math.min(qty, max)) };
        }),
      })),
      clear: () => set({ items: [] }),
    }),
    { name: 'bien-ronda-cart-v7', partialize: (state) => ({ items: state.items }) },
  ),
);
