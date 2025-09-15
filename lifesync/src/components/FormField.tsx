import React from 'react';
import { AlertCircle } from 'lucide-react';
import { getFieldClassName, FormFieldProps } from '../utils/validation';

export function FormField({
  label,
  value,
  onChange,
  error,
  required = false,
  type = 'text',
  placeholder,
  className = ''
}: FormFieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={getFieldClassName(error)}
          aria-invalid={!!error}
          aria-describedby={error ? `${label}-error` : undefined}
        />
        
        {error && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>
      
      {error && (
        <p id={`${label}-error`} className="text-sm text-red-600 flex items-center space-x-1">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  error,
  required = false,
  placeholder = 'Select an option',
  className = ''
}: {
  label: string;
  value: any;
  onChange: (value: any) => void;
  options: { value: any; label: string }[];
  error?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={getFieldClassName(error)}
          aria-invalid={!!error}
          aria-describedby={error ? `${label}-error` : undefined}
        >
          <option value="">{placeholder}</option>
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {error && (
          <div className="absolute inset-y-0 right-8 flex items-center pr-3">
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>
      
      {error && (
        <p id={`${label}-error`} className="text-sm text-red-600 flex items-center space-x-1">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder,
  rows = 3,
  className = ''
}: {
  label: string;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={getFieldClassName(error)}
          aria-invalid={!!error}
          aria-describedby={error ? `${label}-error` : undefined}
        />
        
        {error && (
          <div className="absolute top-2 right-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>
      
      {error && (
        <p id={`${label}-error`} className="text-sm text-red-600 flex items-center space-x-1">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}