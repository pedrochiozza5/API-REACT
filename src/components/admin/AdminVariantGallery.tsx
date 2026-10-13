import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2 } from 'lucide-react';
import { AdminImageActions } from './AdminImageUpload';

type Props = {
  mode?: 'product' | 'variant';
  imageUrl: string;
  imagesText: string;
  disabled: boolean;
  onChange: (patch: { imageUrl?: string; imagesText?: string }) => void;
  onOpenLibrary: () => void;
};

const unique = (text: string) => [...new Set(text.split('\n').map(url=>url.trim()).filter(Boolean))];

export function AdminVariantGallery({mode = 'variant',imageUrl,imagesText,disabled,onChange,onOpenLibrary}: Props) {
  const images=unique(imagesText).filter(url=>url!==imageUrl);
  const changeImages=(urls:string[])=>onChange({imagesText:unique(urls.join('\n')).join('\n')});
  const move=(index:number,offset:number)=>{
    const next=[...images];const other=index+offset;
    if(other<0||other>=next.length)return;
    [next[index],next[other]]=[next[other],next[index]];
    changeImages(next);
  };
  const makeCover=(url:string)=>{
    const remaining=images.filter(item=>item!==url);
    if(imageUrl&&imageUrl!==url)remaining.unshift(imageUrl);
    onChange({imageUrl:url,imagesText:unique(remaining.join('\n')).join('\n')});
  };
  return <section className="mt-5 rounded-[18px] border border-black/10 bg-white p-4" aria-label={mode==='product'?'Galería del producto':'Galería de esta variante'}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-black text-[#172119]">{mode==='product'?'Galería del producto':'Galería de la variante'}</h3>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#526157]">{mode==='product'?'Estas fotos se utilizan como galería general. Podés convertir cualquiera en principal sin volver a subirla.':'Estas fotos pertenecen únicamente a esta variante. Podés elegir otra como principal sin volver a subirla.'}</p>
      </div>
      <span className="rounded-full bg-[#e7eee7] px-3 py-1.5 text-[11px] font-black text-[#174a36]">{images.length} fotos adicionales</span>
    </div>
    <div className="mt-4">
      <AdminImageActions multiple compact disabled={disabled} recommendedMin={1200}
        uploadLabel="Agregar fotos" onOpenLibrary={onOpenLibrary}
        onUploadedMany={media=>{
          const urls=media.map(item=>item.url).filter(Boolean);
          if(!imageUrl && mode==='product' && urls.length){
            onChange({imageUrl:urls[0],imagesText:unique([...images,...urls.slice(1)].join('\n')).join('\n')});
          } else changeImages([...images,...urls.filter(url=>url!==imageUrl)]);
        }}/>
    </div>
    {images.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {images.map((url,index)=><article key={url} className="overflow-hidden rounded-[14px] border border-black/10 bg-[#f4f3ed]">
        <div className="relative aspect-[5/4] bg-white/80 p-2"><img src={url} alt={`Foto ${index+1} de esta variante`} loading="lazy" className="h-full w-full object-contain"/></div>
        <div className="flex items-center justify-between gap-2 border-t border-black/10 p-2">
          <span className="text-[11px] font-bold text-[#526157]">Foto {index+1}</span>
          <div className="flex items-center gap-1">
            <button type="button" disabled={disabled} onClick={()=>makeCover(url)} aria-label={`Hacer principal foto ${index+1}`} title="Hacer principal" className="admin-image-action text-[#174a36]"><Star size={16}/></button>
            <button type="button" disabled={disabled||index===0} onClick={()=>move(index,-1)} aria-label={`Mover antes foto ${index+1}`} className="admin-image-action"><ArrowUp size={16}/></button>
            <button type="button" disabled={disabled||index===images.length-1} onClick={()=>move(index,1)} aria-label={`Mover después foto ${index+1}`} className="admin-image-action"><ArrowDown size={16}/></button>
            <button type="button" disabled={disabled} onClick={()=>changeImages(images.filter(x=>x!==url))} aria-label={`Desasociar foto ${index+1}`} title="Desasociar; no borra el archivo" className="admin-image-action text-red-700"><Trash2 size={16}/></button>
          </div>
        </div>
      </article>)}
    </div> : <div className="mt-4 flex min-h-24 flex-col items-center justify-center rounded-[14px] border border-dashed border-[#bbc8bd] bg-[#f7f8f3] p-4 text-center text-[#45604b]">
      <ImagePlus size={21}/><span className="mt-2 text-xs font-semibold">{mode==='product'?'Todavía no hay fotos adicionales.':'Esta variante todavía no tiene fotos adicionales.'}</span>
      <span className="mt-1 text-[11px]">{mode==='product'?'La imagen principal se muestra primero en tienda.':'Si no tiene imágenes propias, se verá la galería general del producto.'}</span>
    </div>}
    <details className="mt-4 rounded-lg border border-black/10 p-3"><summary className="cursor-pointer text-xs font-bold text-[#435a4b]">Opciones avanzadas · editar URLs</summary>
      <textarea disabled={disabled} className="admin-input mt-3 min-h-[100px]" value={imagesText} onChange={e=>onChange({imagesText:e.target.value})} aria-label="URLs de la galería de variante"/>
    </details>
  </section>;
}
