import type { CSSProperties } from 'react';

export type BrandGlyphKind = 'mate' | 'yerba';

export function BrandGlyph({
  kind,
  className = '',
  title,
}: {
  kind: BrandGlyphKind;
  className?: string;
  title?: string;
}) {
  const url = kind === 'mate' ? '/brand/mate-outline.png' : '/brand/yerba-outline.png';
  const style: CSSProperties = {
    WebkitMaskImage: `url(${url})`,
    maskImage: `url(${url})`,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    backgroundColor: 'currentColor',
  };

  return <span role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} className={`inline-block shrink-0 ${className}`} style={style} />;
}
