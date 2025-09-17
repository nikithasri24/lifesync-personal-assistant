// Form validation utilities

export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateField(value: any, rules: ValidationRule): string | null {
  // Required validation
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return 'This field is required';
  }

  // Skip other validations if value is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }

  // Min/Max validation for numbers
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      return `Value must be at least ${rules.min}`;
    }
    if (rules.max !== undefined && value > rules.max) {
      return `Value must not exceed ${rules.max}`;
    }
  }

  // Min/Max validation for strings (length)
  if (typeof value === 'string') {
    if (rules.min !== undefined && value.length < rules.min) {
      return `Must be at least ${rules.min} characters`;
    }
    if (rules.max !== undefined && value.length > rules.max) {
      return `Must not exceed ${rules.max} characters`;
    }
  }

  // Pattern validation
  if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
    return 'Invalid format';
  }

  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(value);
    if (customError) {
      return customError;
    }
  }

  return null;
}

export function validateForm(data: Record<string, any>, rules: Record<string, ValidationRule>): ValidationResult {
  const errors: Record<string, string> = {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    const error = validateField(data[field], fieldRules);
    if (error) {
      errors[field] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Predefined validation rules
export const validationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address';
      }
      return null;
    }
  },
  
  currency: {
    pattern: /^\d+(\.\d{1,2})?$/,
    custom: (value: string | number) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(num) || num < 0) {
        return 'Please enter a valid amount';
      }
      return null;
    }
  },

  phone: {
    pattern: /^\+?[\d\s\-\(\)]+$/,
    custom: (value: string) => {
      if (value && value.replace(/\D/g, '').length < 10) {
        return 'Please enter a valid phone number';
      }
      return null;
    }
  },

  password: {
    min: 8,
    custom: (value: string) => {
      if (value && value.length < 8) {
        return 'Password must be at least 8 characters';
      }
      if (value && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return 'Password must contain uppercase, lowercase, and number';
      }
      return null;
    }
  }
};

// Form field component helper
export interface FormFieldProps {
  label: string;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  className?: string;
}

export function getFieldClassName(error?: string, baseClassName = '') {
  const base = baseClassName || 'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors';
  const errorClass = error 
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';
  
  return `${base} ${errorClass}`;
}