export interface Meta {
  _id: string;
  category: string;
  value: string;
  label: string;
  active: boolean;
  sort_order: number;
  parent_value?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface MetaOption {
  id: string;
  value: string;
  label: string;
  active: boolean;
  sort_order: number;
  parent_value?: string;
  metadata?: Record<string, any>;
}

export type MetaCategory =
  | 'ins_type'
  | 'ins_status_add'
  | 'ncb'
  | 'payment_mode'
  | 'company_payment_mode'
  | 'customer_payment_type'
  | 'addon_coverage'
  | 'company_bank_name_add'
  | 'exicutive_name'
  | 'insurance_company'
  | 'insurance_dealer'
  | 'branch'
  | 'city'
  | 'nominee_relation'
  | 'vehicle_product'
  | 'manufacturer'
  | 'fuel_type'
  | 'vehicle_model'
  | 'hypothecation';
