import React from 'react';

// Logo oficial de The Card Box MX (versión circular, fondo transparente).
// size: número en px o un string CSS como "100%".
export default function Logo({ size = 48, glow = false, alt = '' }) {
  return (
    <img
      src={typeof size === 'number' && size <= 80 ? '/brand/TheCardBoxMX-logo-160.webp' : '/brand/TheCardBoxMX-logo-512.webp'}
      alt={alt}
      width={typeof size === 'number' ? size : undefined}
      height={typeof size === 'number' ? size : undefined}
      decoding="async"
      style={{
        display: 'block',
        width: size,
        height: size,
        objectFit: 'contain',
        filter: glow ? 'drop-shadow(0 0 18px rgba(192,204,216,0.35))' : undefined,
      }}
    />
  );
}
