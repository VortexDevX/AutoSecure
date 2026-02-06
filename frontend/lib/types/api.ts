// Generic API response wrapper
export interface ApiResponse<T = unknown> {
  status?: 'success' | 'error';
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Pagination metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
  next_page: number | null;
  previous_page: number | null;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Error response
export interface ApiError {
  status: 'error';
  message: string;
  errors?: Record<string, string[]>;
}
