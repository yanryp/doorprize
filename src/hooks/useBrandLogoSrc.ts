import { useEffect, useState } from 'react';

export type LogoVariant = 'color' | 'white';

// Drop the official logos into public/branding/ (SVG preferred, PNG also works).
// "white" is the reversed logo for dark/blue backgrounds; it falls back to the colour logo.
const SOURCES: Record<LogoVariant, string[]> = {
  color: ['/branding/logo.svg', '/branding/logo.png'],
  white: [
    '/branding/logo-white.svg',
    '/branding/logo-white.png',
    '/branding/logo.svg',
    '/branding/logo.png',
  ],
};

const cache = new Map<LogoVariant, Promise<string | null>>();

function probe(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

function resolveLogo(variant: LogoVariant): Promise<string | null> {
  let pending = cache.get(variant);
  if (!pending) {
    pending = (async () => {
      for (const candidate of SOURCES[variant]) if (await probe(candidate)) return candidate;
      return null;
    })();
    cache.set(variant, pending);
  }
  return pending;
}

/** Resolves to the first logo file that exists, or null. Probed once per page load. */
export function useBrandLogoSrc(variant: LogoVariant = 'color'): string | null | undefined {
  const [src, setSrc] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    resolveLogo(variant).then((found) => alive && setSrc(found));
    return () => {
      alive = false;
    };
  }, [variant]);
  return src;
}
