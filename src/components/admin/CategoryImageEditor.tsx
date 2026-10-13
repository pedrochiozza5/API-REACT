import { useRef, type PointerEvent } from 'react';
import { Move, RotateCcw } from 'lucide-react';
import {
  categoryImagePresentation, categoryImageUrl,
  type CategoryImageFit, type CategoryImagePlacement,
} from '@/lib/categoryImage';

type Editable = CategoryImagePlacement & {
  slug:string;
  name:string;
  brandId:string;
  imageUrl:string;
  imagePositionX:number;
  imagePositionY:number;
  imageZoom:number;
  imageFit:CategoryImageFit;
};
type Props={value:Editable;disabled?:boolean;onChange:(patch:Partial<Editable>)=>void};
const clamp=(n:number)=>Math.max(0,Math.min(100,Math.round(n)));

export function CategoryImageEditor({value,disabled=false,onChange}:Props){
  const drag=useRef<{x:number;y:number;positionX:number;positionY:number}|null>(null);
  const {fit,style}=categoryImagePresentation(value);

  function handleMove(event:PointerEvent<HTMLDivElement>){
    const start=drag.current;
    if(!start || disabled)return;
    const rect=event.currentTarget.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    onChange({
      imagePositionX:clamp(start.positionX-(event.clientX-start.x)/rect.width*100),
      imagePositionY:clamp(start.positionY-(event.clientY-start.y)/rect.height*100),
    });
  }

  return <section aria-label="Encuadre de la imagen de categoría" className="category-image-editor grid gap-4 rounded-[18px] border border-black/10 bg-[#efece3] p-3 sm:grid-cols-[minmax(0,1fr)_minmax(220px,.9fr)] sm:p-4">
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-black text-[#173d2c]">Vista previa real</span>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#465a4e]"><Move size={13}/> Arrastrá la imagen</span>
      </div>
      <div
        role="img"
        aria-label={`Vista previa de la categoría ${value.name || 'sin nombre'}`}
        className="relative mx-auto aspect-[.84] max-h-[340px] w-full max-w-[280px] overflow-hidden rounded-[18px] border border-black/10 bg-[radial-gradient(circle_at_50%_30%,#fffaf2,#dbd0bb)] shadow-[0_12px_30px_rgba(20,40,27,.1)]"
        style={{touchAction:disabled?'auto':'none',cursor:disabled?'default':'grab'}}
        onPointerDown={event=>{
          if(disabled || (event.pointerType==='mouse' && event.button!==0))return;
          drag.current={x:event.clientX,y:event.clientY,positionX:value.imagePositionX,positionY:value.imagePositionY};
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={handleMove}
        onPointerUp={event=>{drag.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}}
        onPointerCancel={()=>{drag.current=null;}}
      >
        <img
          src={categoryImageUrl(value)}
          alt=""
          draggable={false}
          style={style}
          className={`pointer-events-none absolute inset-0 h-full w-full select-none ${fit==='contain'?'p-3 sm:p-5':''}`}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex min-h-24 items-end bg-gradient-to-t from-[#061710]/80 via-[#061710]/15 to-transparent p-4">
          <span className="text-xl font-black leading-tight text-white">{value.name || 'Tu categoría'}</span>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-[#526154]">La vista previa utiliza el mismo encuadre de la tienda. El archivo original no se modifica.</p>
    </div>
    <div className="min-w-0 space-y-4">
      <label className="block text-xs font-black text-[#243b2c]">Ajuste de imagen
        <select disabled={disabled} className="admin-input mt-2" value={value.imageFit} onChange={event=>onChange({imageFit:event.target.value as CategoryImageFit})}>
          <option value="auto">Automático (conservar estilo original)</option>
          <option value="cover">Rellenar tarjeta</option>
          <option value="contain">Mostrar imagen completa</option>
        </select>
      </label>
      <label className="block text-xs font-black text-[#243b2c]">
        <span className="flex items-center justify-between gap-2"><span>Acercar / alejar</span><span className="tabular-nums text-[#536456]">{Math.round(value.imageZoom*100)}%</span></span>
        <input aria-label="Zoom de imagen de categoría" type="range" disabled={disabled} min={0.8} max={1.8} step={0.05} value={value.imageZoom} onChange={e=>onChange({imageZoom:Number(e.target.value)})} className="mt-2 w-full accent-[#164b36]"/>
      </label>
      <label className="block text-xs font-black text-[#243b2c]">
        <span className="flex items-center justify-between"><span>Horizontal</span><span className="tabular-nums text-[#536456]">{value.imagePositionX}%</span></span>
        <input aria-label="Posición horizontal de imagen de categoría" type="range" disabled={disabled} min={0} max={100} step={1} value={value.imagePositionX} onChange={e=>onChange({imagePositionX:Number(e.target.value)})} className="mt-2 w-full accent-[#164b36]"/>
      </label>
      <label className="block text-xs font-black text-[#243b2c]">
        <span className="flex items-center justify-between"><span>Vertical</span><span className="tabular-nums text-[#536456]">{value.imagePositionY}%</span></span>
        <input aria-label="Posición vertical de imagen de categoría" type="range" disabled={disabled} min={0} max={100} step={1} value={value.imagePositionY} onChange={e=>onChange({imagePositionY:Number(e.target.value)})} className="mt-2 w-full accent-[#164b36]"/>
      </label>
      <button type="button" disabled={disabled} onClick={()=>onChange({imageFit:'auto',imageZoom:1,imagePositionX:50,imagePositionY:50})} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#abb7a9] bg-white px-4 text-xs font-extrabold text-[#193b2b] hover:bg-[#e7eee4] disabled:opacity-40"><RotateCcw size={15}/> Restablecer encuadre</button>
    </div>
  </section>;
}
