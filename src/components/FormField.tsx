import { AlertCircle } from 'lucide-react'
import { useId, useState, useEffect, type ChangeEvent } from 'react'
import { getFieldClassName } from '../utils/validation'
import type { FormFieldProps } from '../utils/validation'

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
  const generatedId = useId()
  const inputId = `${generatedId}-input`
  const errorId = `${inputId}-error`
  const isControlled = value !== undefined && value !== null
  const [internalValue, setInternalValue] = useState<string>(() => (value ?? '') as string)

  useEffect(() => {
    if (isControlled) {
      setInternalValue((value ?? '') as string)
    }
  }, [isControlled, value])

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const nextValue = event.target.value
    setInternalValue(nextValue)
    onChange(nextValue)
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          type={type}
          id={inputId}
          value={isControlled ? (value ?? '') as string : internalValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={getFieldClassName(error)}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
        
        {error && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <AlertCircle role="img" aria-hidden="true" className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>
      
      {error && (
        <p id={errorId} className="text-sm text-red-600 flex items-center space-x-1" role="alert" aria-live="polite">
          <AlertCircle role="img" aria-hidden="true" className="w-3 h-3 text-red-600" />
          <span className="text-red-600">{error}</span>
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
  value: string | number;
  onChange: (value: string | number) => void;
  options: { value: string | number; label: string }[];
  error?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const generatedId = useId()
  const selectId = `${generatedId}-select`
  const errorId = `${selectId}-error`
  const isControlled = value !== undefined && value !== null
  const [internalValue, setInternalValue] = useState<string>(() => (value ?? '') as string)

  useEffect(() => {
    if (isControlled) {
      setInternalValue((value ?? '') as string)
    }
  }, [isControlled, value])

  const handleChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const nextValue = event.target.value
    setInternalValue(nextValue)
    onChange(nextValue)
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <select
          id={selectId}
          value={isControlled ? (value ?? '') as string : internalValue}
          onChange={handleChange}
          className={getFieldClassName(error)}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
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
            <AlertCircle role="img" aria-hidden="true" className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>
      
      {error && (
        <p id={errorId} className="text-sm text-red-600 flex items-center space-x-1" role="alert">
          <AlertCircle role="img" aria-hidden="true" className="w-3 h-3 text-red-600" />
          <span className="text-red-600">{error}</span>
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
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  const generatedId = useId()
  const textAreaId = `${generatedId}-textarea`
  const errorId = `${textAreaId}-error`
  const isControlled = value !== undefined && value !== null
  const [internalValue, setInternalValue] = useState<string>(() => (value ?? '') as string)

  useEffect(() => {
    if (isControlled) {
      setInternalValue((value ?? '') as string)
    }
  }, [isControlled, value])

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    const nextValue = event.target.value
    setInternalValue(nextValue)
    onChange(nextValue)
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={textAreaId} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <textarea
          id={textAreaId}
          value={isControlled ? (value ?? '') as string : internalValue}
          onChange={handleChange}
          placeholder={placeholder}
          rows={rows}
          className={getFieldClassName(error)}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
        
        {error && (
          <div className="absolute top-2 right-2">
            <AlertCircle role="img" aria-hidden="true" className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>
      
      {error && (
        <p id={errorId} className="text-sm text-red-600 flex items-center space-x-1" role="alert">
          <AlertCircle role="img" aria-hidden="true" className="w-3 h-3 text-red-600" />
          <span className="text-red-600">{error}</span>
        </p>
      )}
    </div>
  );
}
