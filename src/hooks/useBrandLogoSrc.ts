import { useEffect, useState } from 'react';

// Drop the official logo into public/branding/ (logo.svg preferred, logo.png also works).
const SOURCES = ['/branding/logo.svg', '/branding/logo.png'];

let cached: Promise<string | null> | null = null;

function probe(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

/** Resolves to the first logo file that exists, or null. Probed once per page load. */
export function useBrandLogoSrc(): string | null | undefined {
  const [src, setSrc] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    cached ??= (async () => {
      for (const candidate of SOURCES) if (await probe(candidate)) return candidate;
      return null;
    })();
    let alive = true;
    cached.then((found) => alive && setSrc(found));
    return () => {
      alive = false;
    };
  }, []);
  return src;
}
