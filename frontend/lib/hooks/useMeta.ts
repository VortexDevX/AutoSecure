import useSWR from 'swr';
import { getMetaByCategory, getMultipleMetaCategories } from '@/lib/api/meta';

/**
 * Hook to fetch a single meta category
 */
export const useMetaCategory = (category: string) => {
  const { data, error, isLoading } = useSWR(category ? `/api/v1/meta/${category}` : null, () =>
    getMetaByCategory(category)
  );

  return {
    data: data || [],
    isLoading,
    isError: error,
    error,
  };
};

/**
 * Hook to fetch multiple meta categories at once
 */
export const useMultipleMeta = (categories: string[]) => {
  const { data, error, isLoading } = useSWR(
    categories.length > 0 ? `/api/v1/meta/multiple?${categories.join(',')}` : null,
    () => getMultipleMetaCategories(categories)
  );

  return {
    data: data || {},
    isLoading,
    isError: error,
    error,
  };
};

/**
 * Pre-configured hook for policy form meta data
 * Returns all meta options needed for policy forms
 */
export const usePolicyFormMeta = () => {
  const categories = [
    // Step 1
    'ins_type',
    'ins_status_add',
    'insurance_company',
    'insurance_dealer',

    // Step 2
    'branch',
    'exicutive_name',
    'city',
    'nominee_relation', // ✅ NEW

    // Step 3
    'vehicle_product',
    'manufacturer',
    'fuel_type',

    // Step 4
    'ncb',
    'addon_coverage',

    // Step 5
    'customer_payment_type',
    'payment_mode',

    // Step 6
    'company_payment_mode',
    'company_bank_name_add',
  ];

  const { data, isLoading, isError, error } = useMultipleMeta(categories);

  return {
    // Step 1
    insTypes: data['ins_type'] || [],
    insStatuses: data['ins_status_add'] || [],
    insCompanies: data['insurance_company'] || [],
    insuranceDealers: data['insurance_dealer'] || [],

    // Step 2
    branches: data['branch'] || [],
    executiveNames: data['exicutive_name'] || [],
    cities: data['city'] || [],
    nomineeRelations: data['nominee_relation'] || [], // ✅ NEW

    // Step 3
    vehicleProducts: data['vehicle_product'] || [],
    manufacturers: data['manufacturer'] || [],
    fuelTypes: data['fuel_type'] || [],

    // Step 4
    ncbOptions: data['ncb'] || [],
    addonCoverageOptions: data['addon_coverage'] || [],

    // Step 5
    customerPaymentTypes: data['customer_payment_type'] || [],
    paymentModes: data['payment_mode'] || [],

    // Step 6
    companyPaymentModes: data['company_payment_mode'] || [],
    companyBankNames: data['company_bank_name_add'] || [],

    // Loading states
    isLoading,
    isError,
    error,
  };
};
