import type { ProductVariant } from '@/lib/types';

type Props = {
  variants: ProductVariant[];
  selectedId: number | null;
  onChange: (id: number) => void;
};

export function ProductVariantSelector({ variants, selectedId, onChange }: Props) {
  if (!variants.length) return null;
  const current = variants.find(variant => variant.id === selectedId);

  return <fieldset className="mt-5 min-w-0">
    <legend className="text-[12px] font-black text-[#172119]">
      Elegí {variants[0]?.name?.toLowerCase() || 'variante'}
    </legend>
    <p className="mt-1 text-[11px] font-semibold text-[#606a61]">
      {current ? current.value : 'Seleccioná una opción'}
    </p>
    <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Opciones del producto">
      {variants.map(variant => {
        const out = Boolean(variant.trackStock) && Number(variant.stockQty) <= 0;
        const active = selectedId === variant.id;
        return <button
          type="button"
          key={variant.id}
          disabled={out}
          aria-pressed={active}
          aria-label={`${variant.value}${out ? ', agotado' : ''}`}
          onClick={() => onChange(variant.id)}
          className={`flex min-h-12 min-w-0 items-center gap-2 rounded-[14px] border px-3 text-left transition-[background-color,border-color,transform] duration-150 active:scale-[.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174a36]/35 disabled:cursor-not-allowed disabled:opacity-40 ${active ? 'border-[#174a36] bg-[#174a36] text-white' : 'border-black/15 bg-white/90 text-[#172119] hover:border-[#174a36]/45'}`}
        >
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-black/10 bg-white">
            <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: variant.colorHex || '#d8d0bf' }} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[12px] font-extrabold">{variant.value}</span>
            {out && <span className={`block text-[10px] ${active ? 'text-white/75' : 'text-black/50'}`}>Agotado</span>}
          </span>
        </button>;
      })}
    </div>
  </fieldset>;
}
