import { DragEvent, useRef, useState } from 'react';
import { ImagePlus, Library, LoaderCircle, Upload } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export type UploadedMedia = {
  id: number;
  url: string;
  fileName?: string;
  mimeType?: string | null;
  sizeBytes?: number;
  width?: number | null;
  height?: number | null;
};

const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MAX_SIZE = 8 * 1024 * 1024;

export function uploadAdminImage(file: File, onProgress?: (value: number) => void): Promise<UploadedMedia> {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED.has(file.type)) {
      reject(new Error('Subí una imagen JPG, PNG, WEBP o AVIF.'));
      return;
    }
    if (file.size > MAX_SIZE) {
      reject(new Error('La imagen supera el máximo de 8 MB.'));
      return;
    }
    const body = new FormData();
    body.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/upload');
    xhr.withCredentials = true;
    xhr.upload.onprogress = event => {
      if (event.lengthComputable) onProgress?.(Math.max(1, Math.min(99, Math.round((event.loaded / event.total) * 100))));
    };
    xhr.onerror = () => reject(new Error('No se pudo subir la imagen. Revisá la conexión.'));
    xhr.onload = () => {
      let data: any = null;
      try { data = JSON.parse(xhr.responseText || '{}'); } catch { /* handled below */ }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(data?.error || data?.message || 'No se pudo subir la imagen.'));
        return;
      }
      onProgress?.(100);
      resolve(data as UploadedMedia);
    };
    xhr.send(body);
  });
}

export function AdminImageActions({
  onUploaded,
  onUploadedMany,
  onOpenLibrary,
  disabled = false,
  multiple = false,
  uploadLabel = 'Subir desde mi dispositivo',
  libraryLabel = 'Elegir de biblioteca',
  dropLabel = 'o arrastrá una imagen acá',
  compact = false,
  recommendedMin = 0,
  recommendationLabel = 'Para productos recomendamos al menos',
}: {
  onUploaded?: (media: UploadedMedia) => void;
  onUploadedMany?: (media: UploadedMedia[]) => void;
  onOpenLibrary?: () => void;
  disabled?: boolean;
  multiple?: boolean;
  uploadLabel?: string;
  libraryLabel?: string;
  dropLabel?: string;
  compact?: boolean;
  recommendedMin?: number;
  recommendationLabel?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);

  async function uploadFiles(files: File[]) {
    if (disabled || !files.length) return;
    const selected = multiple ? files : files.slice(0, 1);
    setUploading(true);
    setProgress(0);
    const uploaded: UploadedMedia[] = [];
    const failures: string[] = [];
    try {
      for (let i = 0; i < selected.length; i++) {
        try {
          const media = await uploadAdminImage(selected[i], p => setProgress(Math.round(((i + p / 100) / selected.length) * 100)));
          uploaded.push(media);
          if (recommendedMin > 0 && media.width && media.height && (media.width < recommendedMin || media.height < recommendedMin)) {
            toast.warning(`Imagen ${media.width}×${media.height}px. ${recommendationLabel} ${recommendedMin}×${recommendedMin}.`);
          }
        } catch (error: any) {
          failures.push(`${selected[i].name}: ${error?.message || 'no se pudo subir'}`);
        }
      }

      // V8.5: si una de varias cargas falla, las que sí subieron se asignan igualmente.
      // Antes quedaban en Multimedia pero no se agregaban al producto.
      const uniqueUploaded = Array.from(new Map(uploaded.map(item => [item.url, item])).values());
      if (uniqueUploaded.length) {
        if (multiple) {
          if (onUploadedMany) onUploadedMany(uniqueUploaded);
          else uniqueUploaded.forEach(media => onUploaded?.(media));
        } else {
          onUploaded?.(uniqueUploaded[0]);
          onUploadedMany?.(uniqueUploaded);
        }
        qc.invalidateQueries({ queryKey: ['admin-media'] });
        qc.invalidateQueries({ queryKey: ['admin-media-picker'] });
        toast.success(uniqueUploaded.length > 1 ? `${uniqueUploaded.length} imágenes cargadas y asignadas.` : 'Imagen cargada y asignada.');
      }
      if (failures.length) {
        toast.error(`${failures.length} archivo${failures.length === 1 ? '' : 's'} no se pudo subir. Las imágenes correctas se conservaron.`);
      }
    } finally {
      setUploading(false);
      setProgress(0);
      if (input.current) input.current.value = '';
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    uploadFiles(Array.from(event.dataTransfer.files || []));
  }

  return <div className="grid gap-2">
    <input
      ref={input}
      type="file"
      multiple={multiple}
      accept="image/jpeg,image/png,image/webp,image/avif"
      className="hidden"
      onChange={event => uploadFiles(Array.from(event.target.files || []))}
    />
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={disabled || uploading} onClick={() => input.current?.click()} className="admin-secondary-button">
        {uploading ? <LoaderCircle size={14} className="animate-spin"/> : <Upload size={14}/>} {uploading ? `Subiendo ${progress}%` : uploadLabel}
      </button>
      {onOpenLibrary && <button type="button" disabled={disabled || uploading} onClick={onOpenLibrary} className="admin-secondary-button"><Library size={14}/> {libraryLabel}</button>}
    </div>
    {!compact && <div
      onDragEnter={event => { event.preventDefault(); if (!disabled) setDragging(true); }}
      onDragOver={event => { event.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={event => { event.preventDefault(); setDragging(false); }}
      onDrop={onDrop}
      onClick={() => !disabled && !uploading && input.current?.click()}
      className={`group flex min-h-[76px] cursor-pointer items-center justify-center gap-3 rounded-[16px] border border-dashed px-4 text-center transition ${dragging ? 'border-[#164b36] bg-[#164b36]/8' : 'border-black/12 bg-black/[.018] hover:border-[#164b36]/35 hover:bg-[#164b36]/[.035]'} ${disabled ? 'cursor-not-allowed opacity-45' : ''}`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#164b36]"><ImagePlus size={16}/></span>
      <span className="text-left"><b className="block text-[10px] text-black/65">{dragging ? 'Soltá la imagen' : dropLabel}</b><small className="mt-0.5 block text-[8px] text-black/35">JPG, PNG, WEBP o AVIF · máximo 8 MB</small></span>
    </div>}
  </div>;
}
