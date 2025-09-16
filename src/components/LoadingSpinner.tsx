import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export default function LoadingSpinner({ size = 'md', className = '', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
}

// Loading Skeleton Components
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center space-x-4">
        <div className="rounded-full bg-gray-300 h-12 w-12"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-gray-300 rounded"></div>
        <div className="h-3 bg-gray-300 rounded w-5/6"></div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="animate-pulse bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="h-6 bg-gray-300 rounded w-1/4"></div>
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={colIndex}
                className={`h-4 bg-gray-300 rounded ${
                  colIndex === 0 ? 'w-1/4' : colIndex === columns - 1 ? 'w-1/6' : 'w-1/3'
                }`}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
      <div className="h-6 bg-gray-300 rounded w-1/3 mb-6"></div>
      <div className="h-64 bg-gray-300 rounded"></div>
      <div className="mt-4 flex justify-center space-x-4">
        <div className="h-3 bg-gray-300 rounded w-16"></div>
        <div className="h-3 bg-gray-300 rounded w-16"></div>
        <div className="h-3 bg-gray-300 rounded w-16"></div>
      </div>
    </div>
  );
}