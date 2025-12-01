import apiClient from './client';
import { MetaOption } from '@/lib/types/meta';

export interface MetaResponse {
  status: string;
  data: {
    category: string;
    options: MetaOption[];
    count: number;
  };
}

export interface CategoriesResponse {
  status: string;
  data: {
    categories: string[];
    count: number;
  };
}

export interface CreateMetaResponse {
  status: string;
  message: string;
  data: {
    option: MetaOption;
  };
}

export interface UpdateMetaResponse {
  status: string;
  message: string;
  data: {
    option: MetaOption;
  };
}

/**
 * Fetch all meta options for a specific category
 */
export const getMetaByCategory = async (category: string): Promise<MetaOption[]> => {
  const response = await apiClient.get<MetaResponse>(`/api/v1/meta/${category}`);
  return response.data.data.options;
};

/**
 * Fetch all meta categories
 */
export const getMetaCategories = async (): Promise<string[]> => {
  const response = await apiClient.get<CategoriesResponse>('/api/v1/meta/categories');
  return response.data.data.categories;
};

/**
 * Fetch multiple categories at once
 */
export const getMultipleMetaCategories = async (
  categories: string[]
): Promise<Record<string, MetaOption[]>> => {
  const promises = categories.map((category) =>
    getMetaByCategory(category).then((data) => ({ category, data }))
  );

  const results = await Promise.all(promises);

  return results.reduce(
    (acc, { category, data }) => {
      acc[category] = data;
      return acc;
    },
    {} as Record<string, MetaOption[]>
  );
};

/**
 * Create new meta option
 */
export const createMetaOption = async (data: {
  category: string;
  value: string | number;
  label: string;
  parent_value?: string;
  metadata?: Record<string, any>;
}): Promise<MetaOption> => {
  const response = await apiClient.post<CreateMetaResponse>('/api/v1/meta', data);
  return response.data.data.option;
};

/**
 * Update existing meta option
 */
export const updateMetaOption = async (
  id: string,
  data: {
    label?: string;
    active?: boolean;
    parent_value?: string;
    metadata?: Record<string, any>;
  }
): Promise<MetaOption> => {
  const response = await apiClient.patch<UpdateMetaResponse>(`/api/v1/meta/${id}`, data);
  return response.data.data.option;
};

/**
 * Update sort order of meta option
 */
export const updateMetaSortOrder = async (id: string, sortOrder: number): Promise<void> => {
  await apiClient.patch(`/api/v1/meta/${id}/order`, { sort_order: sortOrder });
};

/**
 * Delete meta option
 */
export const deleteMetaOption = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/meta/${id}`);
};

/**
 * Bulk reorder meta options
 */
export const reorderMetaOptions = async (
  category: string,
  order: Array<{ id: string; sort_order: number }>
): Promise<void> => {
  await apiClient.post('/api/v1/meta/reorder', { category, order });
};
