/**
 * PageLayoutV2 Component
 * Reusable page layout with V2 design
 */

import React from 'react';
import { motion } from 'framer-motion';

export interface PageLayoutV2Props {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  spacing?: 'tight' | 'normal' | 'relaxed';
}

const maxWidthClasses = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[1400px]',
  '2xl': 'max-w-[1600px]',
  full: 'max-w-full',
};

const spacingClasses = {
  tight: 'space-y-4',
  normal: 'space-y-6',
  relaxed: 'space-y-8',
};

export const PageLayoutV2: React.FC<PageLayoutV2Props> = ({
  children,
  className = '',
  maxWidth = 'xl',
  spacing = 'normal',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        ${maxWidthClasses[maxWidth]}
        mx-auto px-4 sm:px-6 lg:px-8 py-6
        ${spacingClasses[spacing]}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

export default PageLayoutV2;

