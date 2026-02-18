/**
 * ProductCardV2 Component
 * Product card for skincare products grid (2-column layout)
 * Matches selfcare-design-spec.html exactly
 */

import React from 'react';

interface ProductCardV2Props {
  id: string;
  name: string;
  brand: string;
  category: string;
  rating?: number;
  useFrequency?: string; // e.g., "Daily AM", "2x per week"
  onClick: () => void;
}

export const ProductCardV2: React.FC<ProductCardV2Props> = ({
  id,
  name,
  brand,
  category,
  rating = 0,
  useFrequency,
  onClick,
}) => {
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          style={{
            fontSize: '14px',
            color: i <= rating ? '#D4A574' : '#E8DCC8',
          }}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-all hover:shadow-lg"
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
        position: 'relative',
      }}
    >
      {/* Category Badge */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          padding: '4px 8px',
          background: '#E8DCC8',
          borderRadius: '8px',
          fontSize: '10px',
          fontWeight: '700',
          color: '#6B5847',
          textTransform: 'uppercase',
        }}
      >
        {category}
      </div>

      {/* Product Name */}
      <div
        style={{
          fontSize: '14px',
          fontWeight: '700',
          color: '#5C4A3A',
          marginBottom: '4px',
          paddingRight: '60px',
        }}
      >
        {name}
      </div>

      {/* Brand */}
      <div
        style={{
          fontSize: '12px',
          color: '#9B8B7A',
          marginBottom: '8px',
        }}
      >
        {brand}
      </div>

      {/* Use Frequency */}
      {useFrequency && (
        <div
          style={{
            fontSize: '11px',
            color: '#6B5847',
            marginBottom: '8px',
          }}
        >
          {useFrequency}
        </div>
      )}

      {/* Rating Stars */}
      {rating > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '2px',
            marginTop: '8px',
          }}
        >
          {renderStars()}
        </div>
      )}
    </div>
  );
};
