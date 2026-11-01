import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'table-row' | 'avatar' | 'badge';
  count?: number;
  'aria-label'?: string;
}

export function SkeletonLoader({
  className = '',
  variant = 'text',
  count = 1,
  'aria-label': ariaLabel = 'Loading data...',
}: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  const getBaseClasses = () => {
    switch (variant) {
      case 'avatar':
        return 'w-10 h-10 rounded-full bg-muted/60 animate-pulse';
      case 'badge':
        return 'h-5 w-16 rounded-md bg-muted/60 animate-pulse';
      case 'card':
        return 'h-32 w-full rounded-xl bg-card border border-border/50 p-4 space-y-3 animate-pulse';
      case 'table-row':
        return 'h-10 w-full rounded-md bg-muted/40 animate-pulse';
      case 'text':
      default:
        return 'h-4 w-full rounded bg-muted/60 animate-pulse';
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel}
      className={`space-y-2 ${className}`}
    >
      {items.map((key) => {
        if (variant === 'card') {
          return (
            <div key={key} className={getBaseClasses()}>
              <div className="h-4 w-1/3 rounded bg-muted/70" />
              <div className="h-3 w-3/4 rounded bg-muted/50" />
              <div className="h-3 w-1/2 rounded bg-muted/40" />
            </div>
          );
        }
        return <div key={key} className={getBaseClasses()} />;
      })}
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
}
