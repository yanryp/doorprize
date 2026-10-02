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
 * Festive logo for the projector: floats, glows and gets a light sweep masked
 * to the logo's own shape. The logo itself is never rotated or distorted.
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
      className={`relative inline-block ${className ?? ''}`}
      animate={{
        y: [0, -6, 0],
        filter: [
          'drop-shadow(0 0 6px rgba(251,191,36,0.35))',
          'drop-shadow(0 0 22px rgba(251,191,36,0.85))',
          'drop-shadow(0 0 6px rgba(251,191,36,0.35))',
        ],
      }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <img src={src} alt="Bank SulutGo" className="h-full w-auto" />
      <span className="pointer-events-none absolute inset-0 overflow-hidden" style={mask}>
        <motion.span
          className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/80 to-transparent"
          animate={{ x: ['0%', '400%'] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
        />
      </span>
    </motion.span>
  );
}
