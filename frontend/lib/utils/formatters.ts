import { format, parseISO, formatDistanceToNow } from 'date-fns';

/**
 * Format date to Indian format (DD/MM/YYYY)
 * ✅ FIXED: Handles undefined
 */
export const formatDate = (date: string | Date | undefined): string => {
  if (!date) return '-'; // ✅ Handle undefined/null

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd/MM/yyyy');
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format date to ISO format for input[type="date"]
 * ✅ FIXED: Handles undefined
 */
export const formatDateForInput = (date: string | Date | undefined): string => {
  if (!date) return ''; // ✅ Handle undefined/null

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'yyyy-MM-dd');
  } catch {
    return '';
  }
};

/**
 * Format date with time
 * ✅ FIXED: Handles undefined
 */
export const formatDateTime = (date: string | Date | undefined): string => {
  if (!date) return '-'; // ✅ Handle undefined/null

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd/MM/yyyy HH:mm:ss');
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format relative time (e.g., "2 hours ago")
 * ✅ FIXED: Handles undefined
 */
export const formatRelativeTime = (date: string | Date | undefined): string => {
  if (!date) return '-'; // ✅ Handle undefined/null

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format currency (Indian Rupees)
 * ✅ FIXED: Handles undefined
 */
export const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined || amount === null) return '-'; // ✅ Handle undefined/null

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format number with Indian number system
 * ✅ FIXED: Handles undefined
 */
export const formatNumber = (num: number | undefined): string => {
  if (num === undefined || num === null) return '-'; // ✅ Handle undefined/null

  return new Intl.NumberFormat('en-IN').format(num);
};

/**
 * Format phone number (Indian)
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');

  // Format as +91 XXXXX XXXXX
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }

  return phone;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Truncate text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Capitalize first letter
 */
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Format PAN number (ABCDE1234F)
 */
export const formatPAN = (pan: string): string => {
  return pan.toUpperCase().replace(/[^A-Z0-9]/g, '');
};

/**
 * Format Aadhaar number (XXXX XXXX XXXX)
 */
export const formatAadhaar = (aadhaar: string): string => {
  const cleaned = aadhaar.replace(/\D/g, '');
  if (cleaned.length === 12) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`;
  }
  return aadhaar;
};

/**
 * Format label for display (human-readable)
 */
export const formatLabel = (key: string | undefined): string => {
  if (!key) return '-';

  // Special cases for known values
  const specialCases: Record<string, string> = {
    dealer_policy: 'Dealer Policy',
    direct_policy: 'Direct Policy',
    policy_done: 'Policy Done',
    policy_pending: 'Policy Pending',
    faceless: 'Faceless',
    'non-faceless': 'Non-Faceless',
    pending: 'Pending',
    done: 'Done',
    yes: 'Yes',
    no: 'No',
  };

  if (specialCases[key.toLowerCase()]) {
    return specialCases[key.toLowerCase()];
  }

  // Convert snake_case to Title Case
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
