import { ValidationError } from './errors';

/**
 * Maximum allowed lengths for user inputs to prevent DoS via memory exhaustion
 */
export const MAX_LENGTHS = {
  email: 254,
  password: 128,
  name: 100,
  policy_no: 50,
  search: 200,
  customer: 150,
  address: 500,
  notes: 2000,
} as const;

/**
 * Validate that a string does not exceed the maximum length
 */
export const validateMaxLength = (value: string, max: number): boolean => {
  return value.length <= max;
};

/**
 * Validate string length and return error message if exceeded
 */
export const validateStringLength = (
  value: string,
  fieldName: string,
  max: number
): { valid: boolean; error?: string } => {
  if (value.length > max) {
    return {
      valid: false,
      error: `${fieldName} must not exceed ${max} characters`,
    };
  }
  return { valid: true };
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^\S+@\S+\.\S+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 10) {
    errors.push('Password must be at least 10 characters long');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validatePAN = (pan: string): boolean => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

export const validateAadhaar = (aadhaar: string): boolean => {
  const aadhaarRegex = /^[0-9]{12}$/;
  return aadhaarRegex.test(aadhaar);
};

export const validateMobile = (mobile: string): boolean => {
  const mobileRegex = /^[6-9][0-9]{9}$/;
  return mobileRegex.test(mobile);
};

export const validateFileType = (mimetype: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(mimetype);
};

export const validateFileSize = (size: number, maxSize: number): boolean => {
  return size <= maxSize;
};
