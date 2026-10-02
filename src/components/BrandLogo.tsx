import { motion } from 'framer-motion';
import { useBrandLogoSrc } from '@/hooks/useBrandLogoSrc';

interface BrandLogoProps {
  className?: string;
  /** Rendered when no logo file is present. */
  fallback?: React.ReactNode;
}

export function BrandLogo({ className, fallback = null }: BrandLogoProps) {
  const src = useBrandLogoSrc();
  if (src === undefined) return null;
  if (src === null) return <>{fallback}</>;
  return <img src={src} alt="Bank SulutGo" className={className} />;
}

/**
 * Festive logo for the projector: a white plate that floats and glows, with a
 * light sweep masked to the logo's own shape. The logo itself is never
 * recoloured, rotated or distorted.
 */
export function AnimatedBrandLogo({ className, fallback = null }: BrandLogoProps) {
  const src = useBrandLogoSrc();
  if (src === undefined) return null;
  if (src === null) return <>{fallback}</>;
  const mask = {
    maskImage: `url(${src})`,
    WebkitMaskImage: `url(${src})`,
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
  } as React.CSSProperties;
  return (
    <motion.span
      className="inline-block rounded-2xl bg-white px-4 py-2"
      animate={{
        y: [0, -6, 0],
        boxShadow: [
          '0 0 10px rgba(251,191,36,0.35)',
          '0 0 34px rgba(251,191,36,0.9)',
          '0 0 10px rgba(251,191,36,0.35)',
        ],
      }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* White plate keeps the full-colour logo legible on the blue background. */}
      <span className={`relative block ${className ?? ''}`}>
        <img src={src} alt="Bank SulutGo" className="h-full w-auto" />
        <span className="pointer-events-none absolute inset-0 overflow-hidden" style={mask}>
          <motion.span
            className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/75 to-transparent"
            animate={{ x: ['0%', '400%'] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
          />
        </span>
      </span>
    </motion.span>
  );
}
