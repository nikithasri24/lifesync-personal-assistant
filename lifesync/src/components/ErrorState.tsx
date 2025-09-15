import React from 'react';
import { 
  AlertTriangle, 
  RefreshCw, 
  WifiOff, 
  FileX, 
  Database,
  Bug,
  Shield,
  Frown
} from 'lucide-react';

interface ErrorStateProps {
  type?: 'network' | 'notFound' | 'database' | 'permission' | 'generic' | 'validation';
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

const errorConfig = {
  network: {
    icon: WifiOff,
    title: 'Connection Error',
    message: 'Unable to connect to the server. Please check your internet connection.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  notFound: {
    icon: FileX,
    title: 'Not Found',
    message: 'The requested resource could not be found.',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  database: {
    icon: Database,
    title: 'Database Error',
    message: 'There was an issue accessing the data. Please try again later.',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  permission: {
    icon: Shield,
    title: 'Access Denied',
    message: 'You don\'t have permission to access this resource.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  validation: {
    icon: AlertTriangle,
    title: 'Invalid Data',
    message: 'The provided data is invalid. Please check your input.',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  generic: {
    icon: Bug,
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
};

export default function ErrorState({ 
  type = 'generic', 
  title, 
  message, 
  onRetry, 
  retryText = 'Try Again',
  className = '' 
}: ErrorStateProps) {
  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className={`p-4 rounded-full ${config.bgColor} ${config.borderColor} border-2 mb-4`}>
        <Icon className={`w-8 h-8 ${config.color}`} />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title || config.title}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-sm">
        {message || config.message}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {retryText}
        </button>
      )}
    </div>
  );
}

// Specialized Error Components
export function NetworkError({ onRetry, className = '' }: { onRetry?: () => void; className?: string }) {
  return (
    <ErrorState 
      type="network" 
      onRetry={onRetry} 
      className={className}
    />
  );
}

export function NotFoundError({ resource = 'resource', className = '' }: { resource?: string; className?: string }) {
  return (
    <ErrorState 
      type="notFound" 
      message={`The ${resource} you're looking for doesn't exist or has been moved.`}
      className={className}
    />
  );
}

export function PermissionError({ className = '' }: { className?: string }) {
  return (
    <ErrorState 
      type="permission"
      className={className}
    />
  );
}

// Empty State Component
export function EmptyState({ 
  icon: Icon = Frown,
  title = 'No data found',
  message = 'There\'s nothing here yet.',
  action,
  actionText = 'Get Started',
  className = ''
}: {
  icon?: React.ComponentType<any>;
  title?: string;
  message?: string;
  action?: () => void;
  actionText?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <div className="p-4 rounded-full bg-gray-100 mb-4">
        <Icon className="w-12 h-12 text-gray-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-sm">
        {message}
      </p>
      
      {action && (
        <button
          onClick={action}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}