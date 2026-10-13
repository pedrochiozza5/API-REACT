/** Supported destinations for editorial banners (never JavaScript/data URLs). */
export type BannerDestination = { kind: 'internal'; href: string } | { kind: 'external'; href: string };
export function getBannerDestination(raw: string | null | undefined): BannerDestination | null {
  const href = raw?.trim() ?? '';
  if (!href || /[\\\u0000-\u001f\u007f]/.test(href)) return null;
  if (href.startsWith('/') && !href.startsWith('//')) return { kind: 'internal', href };
  if (/^https?:\/\//i.test(href)) {
    try {
      const parsed = new URL(href);
      if (parsed.username || parsed.password) return null;
      return { kind: 'external', href: parsed.href };
    } catch { return null; }
  }
  return null;
}
