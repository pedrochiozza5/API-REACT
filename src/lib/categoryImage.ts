import type { CSSProperties } from 'react';

export type CategoryImageFit = 'auto' | 'cover' | 'contain';
export type CategoryImagePlacement = {
  imageZoom?: number | null;
  imagePositionX?: number | null;
  imagePositionY?: number | null;
  imageFit?: CategoryImageFit | null;
};
const studioSlugs = new Set(['mates','bombillas','termos','canastas','combos','accesorios']);
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));

/** Shared presentation rule for live editor preview and storefront category card. */
export function categoryImagePresentation(category: CategoryImagePlacement & { slug: string }): {
  fit: 'cover' | 'contain';
  style: CSSProperties;
} {
  const fit = category.imageFit && category.imageFit !== 'auto'
    ? category.imageFit
    : studioSlugs.has(category.slug) ? 'contain' : 'cover';
  const x = clamp(Number(category.imagePositionX ?? 50),0,100);
  const y = clamp(Number(category.imagePositionY ?? 50),0,100);
  const zoom = clamp(Number(category.imageZoom ?? 1),.8,1.8);
  return {
    fit,
    style: {
      objectFit: fit,
      objectPosition: `${x}% ${y}%`,
      transform: `scale(${zoom})`,
      transformOrigin: 'center center',
    },
  };
}
