'use client';

import { Input } from '@/components/ui/Input';
import { SingleDatePicker } from '@/components/ui/DatePicker';
import { usePolicyForm } from '@/lib/context/PolicyFormContext';
import { usePolicyFormMeta } from '@/lib/hooks/useMeta';
import { useMemo } from 'react';

// Add formatter for MM/YYYY
const formatManufacturingDate = (value: string) => {
  // Remove non-digits
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2, 6)}`;
};

export function Step3VehicleDetails() {
  const { formData, updateFormData } = usePolicyForm();
  const { vehicleProducts, manufacturers, fuelTypes, isLoading } = usePolicyFormMeta();

  // Filter manufacturers based on selected product
  const filteredManufacturers = useMemo(() => {
    if (!formData.product) return [];
    return manufacturers.filter((m) => m.parent_value === formData.product);
  }, [formData.product, manufacturers]);

  // Handle manufacturing date input
  const handleMfgDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatManufacturingDate(e.target.value);
    updateFormData({ mfg_date: formatted });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Dropdown */}
        <div>
          <label className="label label-required">Product</label>
          <select
            value={formData.product || ''}
            onChange={(e) => {
              updateFormData({
                product: e.target.value,
                manufacturer: '', // Reset manufacturer when product changes
              });
            }}
            className="input"
            disabled={isLoading}
          >
            <option value="">{isLoading ? 'Loading...' : 'Select product'}</option>
            {vehicleProducts.map((product) => (
              <option key={product.id} value={product.value}>
                {product.label}
              </option>
            ))}
          </select>
        </div>

        {/* Manufacturer Dropdown (Filtered by Product) */}
        <div>
          <label className="label">Manufacturer</label>
          <select
            value={formData.manufacturer || ''}
            onChange={(e) => updateFormData({ manufacturer: e.target.value })}
            className="input"
            disabled={isLoading || !formData.product}
          >
            <option value="">
              {!formData.product
                ? 'Select product first'
                : filteredManufacturers.length === 0
                  ? 'No manufacturers available'
                  : 'Select manufacturer (optional)'}
            </option>
            {filteredManufacturers.map((manufacturer) => (
              <option key={manufacturer.id} value={manufacturer.value}>
                {manufacturer.label}
              </option>
            ))}
          </select>
          {formData.product && filteredManufacturers.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              No manufacturers found for {formData.product}. Add options in Meta Management.
            </p>
          )}
        </div>

        {/* Model Name (Manual Text Input) */}
        <Input
          label="Model Name"
          type="text"
          placeholder="e.g., Swift, Activa, Ace (optional)"
          value={formData.model_name || ''}
          onChange={(e) => updateFormData({ model_name: e.target.value })}
        />

        {/* Fuel Type Dropdown */}
        <div>
          <label className="label">Fuel Type</label>
          <select
            value={formData.fuel_type || ''}
            onChange={(e) => updateFormData({ fuel_type: e.target.value })}
            className="input"
            disabled={isLoading}
          >
            <option value="">{isLoading ? 'Loading...' : 'Select fuel type (optional)'}</option>
            {fuelTypes.map((fuel) => (
              <option key={fuel.id} value={fuel.value}>
                {fuel.label}
              </option>
            ))}
          </select>
        </div>

        {/* Hypothecation (Text Input) */}
        <Input
          label="Hypothecation"
          type="text"
          placeholder="e.g., HDFC Bank, ICICI Bank (optional)"
          value={formData.hypothecation || ''}
          onChange={(e) => updateFormData({ hypothecation: e.target.value })}
        />

        {/* Manufacturing Date - CHANGED TO TEXT INPUT */}
        <Input
          label="Manufacturing Date"
          type="text"
          placeholder="MM/YYYY (e.g., 01/2024)"
          value={formData.mfg_date || ''}
          onChange={handleMfgDateChange}
          maxLength={7} // MM/YYYY
        />

        {/* Engine Number */}
        <Input
          label="Engine Number"
          type="text"
          placeholder="Engine number (optional)"
          value={formData.engine_no || ''}
          onChange={(e) => updateFormData({ engine_no: e.target.value.toUpperCase() })}
        />

        {/* Chassis Number */}
        <Input
          label="Chassis Number"
          type="text"
          placeholder="Chassis number (optional)"
          value={formData.chassis_no || ''}
          onChange={(e) => updateFormData({ chassis_no: e.target.value.toUpperCase() })}
        />

        {/* Registration Number (Required) */}
        <Input
          label="Registration Number"
          type="text"
          placeholder="e.g., GJ01AB1234"
          value={formData.registration_number || ''}
          onChange={(e) => updateFormData({ registration_number: e.target.value.toUpperCase() })}
          required
        />

        {/* Registration Date */}
        <SingleDatePicker
          label="Registration Date"
          value={formData.registration_date ? new Date(formData.registration_date) : null}
          onChange={(date) =>
            updateFormData({ registration_date: date ? date.toISOString().split('T')[0] : '' })
          }
          placeholder="Registration Date"
        />
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>💡 Tip:</strong> Select <strong>Product</strong> first to see relevant
          manufacturers. Model name can be entered manually.
        </p>
      </div>
    </div>
  );
}
