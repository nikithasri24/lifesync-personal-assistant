/**
 * CardV2 Component
 * Premium card with glassmorphism and hover effects
 */

import React from 'react';

export type CardVariant = 'default' | 'elevated' | 'glass' | 'gradient';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hoverable?: boolean;
  clickable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantStyles: Record<CardVariant, string> = {
  default: `
    bg-[var(--bg-secondary)]
    border border-[var(--border-primary)]
    shadow-sm
  `,
  elevated: `
    bg-[var(--bg-secondary)]
    shadow-md
  `,
  glass: `
    glass
    shadow-md
  `,
  gradient: `
    bg-gradient-to-br from-primary-500/8 to-secondary-500/8
    border border-primary-500/15
    shadow-sm
  `,
};

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  hoverable = false,
  clickable = false,
  padding = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = `
    rounded-2xl
    transition-all duration-300
  `;

  const hoverStyles = hoverable || clickable ? `
    hover:shadow-lg
    hover:-translate-y-1
  ` : '';

  const clickableStyles = clickable ? 'cursor-pointer' : '';

  return (
    <div
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${hoverStyles}
        ${clickableStyles}
        ${className}
        animate-fadeIn
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

