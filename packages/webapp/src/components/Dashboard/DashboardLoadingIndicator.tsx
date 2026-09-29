import React from 'react';
import FaroCapitalLoading from './FaroCapitalLoading';
import { Choose } from '@/components';

interface DashboardLoadingIndicatorProps {
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Dashboard loading indicator.
 */
export default function DashboardLoadingIndicator({
  isLoading = false,
  className,
  children,
}: DashboardLoadingIndicatorProps) {
  return (
    <Choose>
      <Choose.When condition={isLoading}>
        <FaroCapitalLoading />
      </Choose.When>

      <Choose.Otherwise>{children}</Choose.Otherwise>
    </Choose>
  );
}
