import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Search } from 'lucide-react';
import { toast } from 'sonner';
import { AdminCard, AdminPage, AdminPageHeader } from '@/components/admin/AdminUI';
import { ProductImage } from '@/components/storefront/ProductImage';
import { apiGet, apiSend } from '@/lib/api';
import { money } from '@/lib/format';
import { legacyProductImage } from '@/lib/productImages';
import type { Product } from '@/lib/types';
import { brandQuery, useAdmin } from '@/components/admin/AdminContext';

type WholesalePayload = {
  wholesaleEnabled: boolean;
  wholesalePrice: number | null;
  wholesaleMinQty: number;
  variants: { id: number; wholesalePrice: number | null }[];
};

export function AdminWholesale() {
  const { brand, can } = useAdmin();
  const [search, setSearch] = useState('');
  const products = useQuery({
    queryKey: ['admin-wholesale-products', brand],
    queryFn: () => apiGet<Product[]>(`/api/admin/products${brandQuery(brand)}`),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products.data || [];
    return (products.data || []).filter((product) =>
      `${product.name} ${product.sku} ${product.categoryName || ''}`.toLowerCase().includes(q),
    );
  }, [products.data, search]);

  return <AdminPage>
    <AdminPageHeader
      eyebrow="Lista comercial"
      title="Mayoristas"
      description="Manejá una lista mayorista separada sin modificar precios minoristas, stock ni imágenes."
    />

    <AdminCard>
      <label className="admin-wholesale-search">
        <Search size={15}/>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar producto o SKU"/>
      </label>
      <div className="mt-3 text-[9px] font-semibold text-black/38">
        {filtered.length} producto{filtered.length === 1 ? '' : 's'} · los cambios se guardan por producto
      </div>
    </AdminCard>

    <div className="mt-4 grid gap-3">
      {products.isLoading && Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-[20px] bg-white/65"/>)}
      {!products.isLoading && filtered.map((product) => <WholesaleRow key={product.id} product={product} canEdit={can('products.price')}/>)}
      {!products.isLoading && !filtered.length && <AdminCard><div className="py-10 text-center text-xs font-bold text-black/38">No encontramos productos.</div></AdminCard>}
    </div>
  </AdminPage>;
}

function WholesaleRow({ product, canEdit }: { product: Product; canEdit: boolean }) {
  const qc = useQueryClient();
  const [enabled, setEnabled] = useState(Boolean(product.wholesaleEnabled));
  const [price, setPrice] = useState(product.wholesalePrice == null ? '' : String(product.wholesalePrice));
  const [minQty, setMinQty] = useState(String(product.wholesaleMinQty ?? 6));
  const [variantPrices, setVariantPrices] = useState<Record<number, string>>(() =>
    Object.fromEntries((product.variants || []).map((variant) => [variant.id, variant.wholesalePrice == null ? '' : String(variant.wholesalePrice)])),
  );

  useEffect(() => {
    setEnabled(Boolean(product.wholesaleEnabled));
    setPrice(product.wholesalePrice == null ? '' : String(product.wholesalePrice));
    setMinQty(String(product.wholesaleMinQty ?? 6));
    setVariantPrices(Object.fromEntries((product.variants || []).map((variant) => [variant.id, variant.wholesalePrice == null ? '' : String(variant.wholesalePrice)])));
  }, [product]);

  const save = useMutation({
    mutationFn: () => {
      const payload: WholesalePayload = {
        wholesaleEnabled: enabled,
        wholesalePrice: price === '' ? null : Number(price),
        wholesaleMinQty: Math.max(1, Number(minQty || 1)),
        variants: (product.variants || []).map((variant) => ({
          id: variant.id,
          wholesalePrice: variantPrices[variant.id] === '' || variantPrices[variant.id] == null ? null : Number(variantPrices[variant.id]),
        })),
      };
      return apiSend<{ ok: boolean; product: Product }>(`/api/admin/wholesale/${product.id}`, 'PUT', payload);
    },
    onSuccess: () => {
      toast.success(`${product.name}: precio mayorista guardado.`);
      qc.invalidateQueries({ queryKey: ['admin-wholesale-products'] });
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['admin-product', product.id] });
    },
    onError: (error: any) => toast.error(error.message || 'No se pudo guardar.'),
  });

  return <section className={`admin-wholesale-row ${enabled ? 'is-enabled' : ''}`}>
    <div className="admin-wholesale-product">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[14px] bg-[#f3efe6]">
        <ProductImage
          src={product.imageUrl || product.images?.[0]?.imageUrl || legacyProductImage(product)}
          alt={product.name}
          categoryName={product.categoryName}
          zoom={1}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-black text-[#172119]">{product.name}</div>
        <div className="mt-1 font-mono-ui text-[8px] uppercase tracking-[.1em] text-black/32">{product.sku} · minorista {money(Number(product.price))}</div>
        <label className="mt-2 inline-flex items-center gap-2 text-[9px] font-black text-black/60">
          <input type="checkbox" disabled={!canEdit} checked={enabled} onChange={(event) => setEnabled(event.target.checked)}/>
          Lista mayorista activa
        </label>
      </div>
    </div>

    <div className="admin-wholesale-fields">
      <label className="admin-field-label">Precio mayorista base
        <input disabled={!canEdit || !enabled} type="number" min="0" className="admin-input" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Sin definir"/>
      </label>
      <label className="admin-field-label">Mínimo
        <input disabled={!canEdit || !enabled} type="number" min="1" className="admin-input" value={minQty} onChange={(event) => setMinQty(event.target.value)}/>
      </label>
    </div>

    {(product.variants || []).length > 0 && <details className="admin-wholesale-variants">
      <summary>Precios por variante · {(product.variants || []).length}</summary>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {(product.variants || []).map((variant) => <label key={variant.id} className="rounded-[13px] border border-black/6 bg-white/70 p-3">
          <span className="block text-[9px] font-black">{variant.value}</span>
          <span className="mt-1 block text-[7px] text-black/35">{variant.sku} · minorista {money(Number(variant.price ?? product.price))}</span>
          <input disabled={!canEdit || !enabled} type="number" min="0" className="admin-input mt-2" value={variantPrices[variant.id] ?? ''} onChange={(event) => setVariantPrices((current) => ({ ...current, [variant.id]: event.target.value }))} placeholder={price || 'Heredar base'}/>
        </label>)}
      </div>
    </details>}

    <div className="flex justify-end">
      <button type="button" disabled={!canEdit || save.isPending} onClick={() => save.mutate()} className="admin-primary-button">
        <Save size={14}/> {save.isPending ? 'Guardando…' : 'Guardar mayorista'}
      </button>
    </div>
  </section>;
}
