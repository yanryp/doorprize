import { useState } from 'react';

// Drop the official logo into public/branding/ (logo.svg preferred, logo.png also works).
const SOURCES = ['/branding/logo.svg', '/branding/logo.png'];

interface BrandLogoProps {
  className?: string;
  /** Rendered when no logo file is present. */
  fallback?: React.ReactNode;
}

export function BrandLogo({ className, fallback = null }: BrandLogoProps) {
  const [index, setIndex] = useState(0);
  if (index >= SOURCES.length) return <>{fallback}</>;
  return (
    <img
      src={SOURCES[index]}
      alt="Bank SulutGo"
      className={className}
      onError={() => setIndex((i) => i + 1)}
    />
  );
}
