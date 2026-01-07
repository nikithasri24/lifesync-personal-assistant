/**
 * SafeArea components for handling iOS notch and home indicator
 * 
 * Uses CSS env() variables for safe area insets
 */

import React from 'react';
import { usePlatform } from '@/hooks/usePlatform';

interface SafeAreaProps {
  children: React.ReactNode;
  className?: string;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
}

/**
 * Wrapper that adds safe area padding
 */
export function SafeArea({
  children,
  className = '',
  top = true,
  bottom = true,
  left = true,
  right = true,
}: SafeAreaProps): React.ReactElement {
  const { isNative } = usePlatform();
  
  // Only apply safe area on native platforms
  if (!isNative) {
    return <div className={className}>{children}</div>;
  }
  
  const style: React.CSSProperties = {
    paddingTop: top ? 'env(safe-area-inset-top)' : undefined,
    paddingBottom: bottom ? 'env(safe-area-inset-bottom)' : undefined,
    paddingLeft: left ? 'env(safe-area-inset-left)' : undefined,
    paddingRight: right ? 'env(safe-area-inset-right)' : undefined,
  };
  
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

/**
 * Top safe area spacer (for status bar / notch)
 */
export function SafeAreaTop({ className = '' }: { className?: string }): React.ReactElement | null {
  const { isNative } = usePlatform();
  
  if (!isNative) return null;
  
  return (
    <div
      className={className}
      style={{ height: 'env(safe-area-inset-top)' }}
    />
  );
}

/**
 * Bottom safe area spacer (for home indicator)
 */
export function SafeAreaBottom({ className = '' }: { className?: string }): React.ReactElement | null {
  const { isNative } = usePlatform();
  
  if (!isNative) return null;
  
  return (
    <div
      className={className}
      style={{ height: 'env(safe-area-inset-bottom)' }}
    />
  );
}

/**
 * Hook to get safe area inset values
 */
export function useSafeAreaInsets(): {
  top: string;
  bottom: string;
  left: string;
  right: string;
} {
  const { isNative } = usePlatform();
  
  if (!isNative) {
    return { top: '0px', bottom: '0px', left: '0px', right: '0px' };
  }
  
  return {
    top: 'env(safe-area-inset-top, 0px)',
    bottom: 'env(safe-area-inset-bottom, 0px)',
    left: 'env(safe-area-inset-left, 0px)',
    right: 'env(safe-area-inset-right, 0px)',
  };
}

/**
 * CSS class names for safe area handling
 */
export const safeAreaClasses = {
  // Padding classes
  paddingTop: 'pt-[env(safe-area-inset-top)]',
  paddingBottom: 'pb-[env(safe-area-inset-bottom)]',
  paddingLeft: 'pl-[env(safe-area-inset-left)]',
  paddingRight: 'pr-[env(safe-area-inset-right)]',
  paddingX: 'px-[max(1rem,env(safe-area-inset-left))]',
  paddingY: 'py-[max(1rem,env(safe-area-inset-top))]',
  
  // Bottom positioning for FABs
  bottomFab: 'bottom-[max(1rem,calc(env(safe-area-inset-bottom)+1rem))]',
  
  // Full safe area padding
  all: 'p-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]',
};

