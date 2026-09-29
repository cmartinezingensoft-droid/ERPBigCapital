import React from 'react';
import '@/style/components/FaroCapitalLoading.scss';

interface FaroCapitalLoadingProps {
  isOpen?: boolean;
}

export default function FaroCapitalLoading({ isOpen = true }: FaroCapitalLoadingProps) {
  if (!isOpen) return null;
  return (
    <div className="farocapital-loading" aria-label="Cargando FaroCapital">
      <img src="/farocapital-logo.png" alt="" width={48} height={48} />
    </div>
  );
}
