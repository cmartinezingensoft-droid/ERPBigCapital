import React from 'react';

export interface FaroCapitalBrandProps {
  compact?: boolean;
  size?: number;
  className?: string;
  inverse?: boolean;
}

export function FaroCapitalBrand({
  compact = false,
  size = 36,
  className,
  inverse = false,
}: FaroCapitalBrandProps) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 0 : 10,
        color: inverse ? '#fff' : 'inherit',
      }}
      aria-label="FaroCapital"
    >
      <img
        src="/farocapital-logo.png"
        alt=""
        width={size}
        height={size}
        style={{ display: 'block', objectFit: 'contain' }}
      />
      {!compact && (
        <span
          style={{
            fontSize: Math.max(20, Math.round(size * 0.72)),
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          FaroCapital
        </span>
      )}
    </span>
  );
}
