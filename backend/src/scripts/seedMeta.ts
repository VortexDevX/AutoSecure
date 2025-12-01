import dotenv from 'dotenv';
import { connectDatabase } from '../config/database';
import { Meta } from '../models';

dotenv.config();

const metaSeedData = [
  // ========== POLICY DETAILS ==========

  // Insurance Type
  {
    category: 'ins_type',
    options: [
      { value: 'company_policy', label: 'Company Policy', sort_order: 1 },
      { value: 'dealer_policy', label: 'Dealer Policy', sort_order: 2 },
    ],
  },

  // Insurance Status
  {
    category: 'ins_status_add',
    options: [
      { value: 'policy_done', label: 'POLICY DONE', sort_order: 1 },
      { value: 'policy_pending', label: 'POLICY PENDING', sort_order: 2 },
    ],
  },

  // Insurance Company
  {
    category: 'insurance_company',
    options: [
      { value: 'hdfc_ergo', label: 'HDFC ERGO', sort_order: 1 },
      { value: 'icici_lombard', label: 'ICICI Lombard', sort_order: 2 },
      { value: 'bajaj_allianz', label: 'Bajaj Allianz', sort_order: 3 },
      { value: 'tata_aig', label: 'Tata AIG', sort_order: 4 },
      { value: 'reliance_general', label: 'Reliance General', sort_order: 5 },
      { value: 'sbi_general', label: 'SBI General Insurance', sort_order: 6 },
      { value: 'royal_sundaram', label: 'Royal Sundaram', sort_order: 7 },
      { value: 'future_generali', label: 'Future Generali', sort_order: 8 },
      { value: 'digit', label: 'Digit Insurance', sort_order: 9 },
      { value: 'acko', label: 'Acko General Insurance', sort_order: 10 },
      { value: 'new_india', label: 'New India Assurance', sort_order: 11 },
      { value: 'oriental', label: 'Oriental Insurance', sort_order: 12 },
      { value: 'national', label: 'National Insurance', sort_order: 13 },
      { value: 'united_india', label: 'United India Insurance', sort_order: 14 },
      { value: 'go_digit', label: 'Go Digit', sort_order: 15 },
      { value: 'iffco_tokio', label: 'IFFCO Tokio', sort_order: 16 },
      { value: 'cholamandalam', label: 'Cholamandalam MS', sort_order: 17 },
      { value: 'shriram', label: 'Shriram General Insurance', sort_order: 18 },
      { value: 'liberty', label: 'Liberty General Insurance', sort_order: 19 },
      { value: 'other', label: 'Other', sort_order: 99 },
    ],
  },

  {
    category: 'insurance_dealer',
    options: [
      { value: 'pos_ins_dekho', label: 'POS INS Dekho', sort_order: 1 },
      { value: 'pos_tata_aig', label: 'POS TATA AIG', sort_order: 2 },
      { value: 'krunal_dealer', label: 'KRUNAL DEALER', sort_order: 3 },
    ],
  },

  // ========== CUSTOMER DETAILS ==========

  // Branch
  {
    category: 'branch',
    options: [
      { value: 'ahmedabad', label: 'Ahmedabad', sort_order: 1 },
      { value: 'surat', label: 'Surat', sort_order: 2 },
      { value: 'vadodara', label: 'Vadodara', sort_order: 3 },
      { value: 'rajkot', label: 'Rajkot', sort_order: 4 },
      { value: 'other', label: 'Other', sort_order: 99 },
    ],
  },

  // Executive Name (empty - to be filled by admin)
  {
    category: 'exicutive_name',
    options: [
      { value: 'haresh', label: 'Haresh', sort_order: 1 },
      { value: 'vaibhav', label: 'Vaibhav', sort_order: 2 },
      { value: 'asmita', label: 'Asmita', sort_order: 3 },
    ],
  },

  // City
  {
    category: 'city',
    options: [
      { value: 'ahmedabad', label: 'Ahmedabad', sort_order: 1 },
      { value: 'surat', label: 'Surat', sort_order: 2 },
      { value: 'vadodara', label: 'Vadodara', sort_order: 3 },
      { value: 'rajkot', label: 'Rajkot', sort_order: 4 },
      { value: 'gandhinagar', label: 'Gandhinagar', sort_order: 5 },
      { value: 'bhavnagar', label: 'Bhavnagar', sort_order: 6 },
      { value: 'jamnagar', label: 'Jamnagar', sort_order: 7 },
      { value: 'junagadh', label: 'Junagadh', sort_order: 8 },
      { value: 'anand', label: 'Anand', sort_order: 9 },
      { value: 'navsari', label: 'Navsari', sort_order: 10 },
      { value: 'other', label: 'Other', sort_order: 99 },
    ],
  },

  // ✅ NEW: Nominee Relation
  {
    category: 'nominee_relation',
    options: [
      { value: 'spouse', label: 'Spouse', sort_order: 1 },
      { value: 'son', label: 'Son', sort_order: 2 },
      { value: 'daughter', label: 'Daughter', sort_order: 3 },
      { value: 'father', label: 'Father', sort_order: 4 },
      { value: 'mother', label: 'Mother', sort_order: 5 },
      { value: 'brother', label: 'Brother', sort_order: 6 },
      { value: 'sister', label: 'Sister', sort_order: 7 },
      { value: 'friend', label: 'Friend', sort_order: 8 },
      { value: 'other', label: 'Other', sort_order: 9 },
    ],
  },

  // ========== VEHICLE DETAILS ==========

  // Vehicle Product (Parent for Manufacturer)
  {
    category: 'vehicle_product',
    options: [
      { value: 'two_wheeler', label: 'Two Wheeler', sort_order: 1 },
      { value: 'three_wheeler', label: 'Three Wheeler', sort_order: 2 },
      { value: 'four_wheeler', label: 'Four Wheeler', sort_order: 3 },
      { value: 'commercial', label: 'Commercial Vehicle', sort_order: 4 },
    ],
  },

  // Manufacturer (Dependent on vehicle_product)
  {
    category: 'manufacturer',
    options: [
      // Two Wheeler
      { value: 'bajaj', label: 'Bajaj', parent_value: 'two_wheeler', sort_order: 1 },
      { value: 'honda_2w', label: 'Honda', parent_value: 'two_wheeler', sort_order: 2 },
      { value: 'tvs', label: 'TVS', parent_value: 'two_wheeler', sort_order: 3 },
      { value: 'hero', label: 'Hero', parent_value: 'two_wheeler', sort_order: 4 },
      { value: 'yamaha', label: 'Yamaha', parent_value: 'two_wheeler', sort_order: 5 },
      { value: 'suzuki_2w', label: 'Suzuki', parent_value: 'two_wheeler', sort_order: 6 },
      { value: 'ktm', label: 'KTM', parent_value: 'two_wheeler', sort_order: 7 },
      {
        value: 'royal_enfield',
        label: 'Royal Enfield',
        parent_value: 'two_wheeler',
        sort_order: 8,
      },

      // Three Wheeler
      { value: 'bajaj_3w', label: 'Bajaj', parent_value: 'three_wheeler', sort_order: 1 },
      { value: 'mahindra_3w', label: 'Mahindra', parent_value: 'three_wheeler', sort_order: 2 },
      { value: 'piaggio', label: 'Piaggio', parent_value: 'three_wheeler', sort_order: 3 },
      { value: 'atul', label: 'Atul Auto', parent_value: 'three_wheeler', sort_order: 4 },

      // Four Wheeler
      { value: 'maruti', label: 'Maruti Suzuki', parent_value: 'four_wheeler', sort_order: 1 },
      { value: 'hyundai', label: 'Hyundai', parent_value: 'four_wheeler', sort_order: 2 },
      { value: 'tata', label: 'Tata', parent_value: 'four_wheeler', sort_order: 3 },
      { value: 'honda', label: 'Honda', parent_value: 'four_wheeler', sort_order: 4 },
      { value: 'mahindra', label: 'Mahindra', parent_value: 'four_wheeler', sort_order: 5 },
      { value: 'toyota', label: 'Toyota', parent_value: 'four_wheeler', sort_order: 6 },
      { value: 'kia', label: 'Kia', parent_value: 'four_wheeler', sort_order: 7 },
      { value: 'mg', label: 'MG Motor', parent_value: 'four_wheeler', sort_order: 8 },
      { value: 'renault', label: 'Renault', parent_value: 'four_wheeler', sort_order: 9 },
      { value: 'nissan', label: 'Nissan', parent_value: 'four_wheeler', sort_order: 10 },
      { value: 'volkswagen', label: 'Volkswagen', parent_value: 'four_wheeler', sort_order: 11 },
      { value: 'skoda', label: 'Skoda', parent_value: 'four_wheeler', sort_order: 12 },
      { value: 'ford', label: 'Ford', parent_value: 'four_wheeler', sort_order: 13 },

      // Commercial
      { value: 'tata_cv', label: 'Tata', parent_value: 'commercial', sort_order: 1 },
      { value: 'ashok_leyland', label: 'Ashok Leyland', parent_value: 'commercial', sort_order: 2 },
      { value: 'mahindra_cv', label: 'Mahindra', parent_value: 'commercial', sort_order: 3 },
      { value: 'eicher', label: 'Eicher', parent_value: 'commercial', sort_order: 4 },
      { value: 'bharat_benz', label: 'BharatBenz', parent_value: 'commercial', sort_order: 5 },
      { value: 'force', label: 'Force Motors', parent_value: 'commercial', sort_order: 6 },
    ],
  },

  // Fuel Type
  {
    category: 'fuel_type',
    options: [
      { value: 'petrol', label: 'Petrol', sort_order: 1 },
      { value: 'diesel', label: 'Diesel', sort_order: 2 },
      { value: 'cng', label: 'CNG', sort_order: 3 },
      { value: 'lpg', label: 'LPG', sort_order: 4 },
      { value: 'electric', label: 'Electric', sort_order: 5 },
      { value: 'hybrid', label: 'Hybrid', sort_order: 6 },
    ],
  },

  // ========== PREMIUM DETAILS ==========

  // NCB (No Claim Bonus) - Used for current NCB AND previous policy NCB
  {
    category: 'ncb',
    options: [
      { value: '0', label: '0%', sort_order: 1 },
      { value: '20', label: '20%', sort_order: 2 },
      { value: '25', label: '25%', sort_order: 3 },
      { value: '35', label: '35%', sort_order: 4 },
      { value: '45', label: '45%', sort_order: 5 },
      { value: '50', label: '50%', sort_order: 6 },
    ],
  },

  {
    category: 'addon_coverage',
    options: [
      { value: 'zero_dep', label: 'Zero Depreciation', sort_order: 1 },
      { value: 'engine_protect', label: 'Engine Protection', sort_order: 2 },
      { value: 'consumables', label: 'Consumables', sort_order: 3 },
      { value: 'rti', label: 'Return to Invoice', sort_order: 4 },
      { value: 'ncb_protect', label: 'NCB Protection', sort_order: 5 },
      { value: 'rsa', label: 'Roadside Assistance', sort_order: 6 },
      { value: 'key_replace', label: 'Key Replacement', sort_order: 7 },
      { value: 'tyre_protect', label: 'Tyre Protection', sort_order: 8 },
      { value: 'personal_belong', label: 'Personal Belongings', sort_order: 9 },
    ],
  },

  // ========== PAYMENT DETAILS ==========

  // Payment Mode (Customer)
  {
    category: 'payment_mode',
    options: [
      { value: 'cash', label: 'Cash', sort_order: 1 },
      { value: 'cheque', label: 'Cheque', sort_order: 2 },
      { value: 'credit', label: 'Credit Card', sort_order: 3 },
      { value: 'debit', label: 'Debit Card', sort_order: 4 },
      { value: 'online', label: 'Online Transfer', sort_order: 5 },
      { value: 'upi', label: 'UPI', sort_order: 6 },
      { value: 'rtgs', label: 'RTGS', sort_order: 7 },
      { value: 'neft', label: 'NEFT', sort_order: 8 },
      { value: 'imps', label: 'IMPS', sort_order: 9 },
    ],
  },

  // Customer Payment Type
  {
    category: 'customer_payment_type',
    options: [
      { value: 'cash', label: 'Cash', sort_order: 1 },
      { value: 'cheque', label: 'Cheque', sort_order: 2 },
      { value: 'online', label: 'Online', sort_order: 3 },
      { value: 'credit', label: 'Credit Card', sort_order: 4 },
      { value: 'payment_link', label: 'Payment Link', sort_order: 5 },
    ],
  },

  // Company Payment Mode (formerly krunal_payment_mode)
  {
    category: 'company_payment_mode',
    options: [
      { value: 'cash', label: 'Cash', sort_order: 1 },
      { value: 'cheque', label: 'Cheque', sort_order: 2 },
      { value: 'online', label: 'Online', sort_order: 3 },
      { value: 'credit', label: 'Credit Card', sort_order: 4 },
      { value: 'payment_link', label: 'Payment Link To Customer', sort_order: 5 },
    ],
  },

  // Company Bank Name (formerly krunal_bank_name_add)
  {
    category: 'company_bank_name_add',
    options: [
      { value: 'hdfc', label: 'HDFC Bank', sort_order: 1 },
      { value: 'icici', label: 'ICICI Bank', sort_order: 2 },
      { value: 'sbi', label: 'State Bank of India', sort_order: 3 },
      { value: 'axis', label: 'Axis Bank', sort_order: 4 },
      { value: 'kotak', label: 'Kotak Mahindra Bank', sort_order: 5 },
      { value: 'pnb', label: 'Punjab National Bank', sort_order: 6 },
      { value: 'bob', label: 'Bank of Baroda', sort_order: 7 },
      { value: 'canara', label: 'Canara Bank', sort_order: 8 },
      { value: 'other', label: 'Other', sort_order: 9 },
    ],
  },
];

const seedMeta = async () => {
  try {
    await connectDatabase();

    console.log('\n🌱 Seeding Meta collection...\n');

    let insertedCount = 0;
    let skippedCount = 0;

    for (const categoryData of metaSeedData) {
      console.log(`Processing category: ${categoryData.category}`);

      for (const option of categoryData.options) {
        try {
          await Meta.create({
            category: categoryData.category,
            value: option.value,
            label: option.label,
            active: true,
            sort_order: option.sort_order,
            parent_value: (option as any).parent_value || undefined,
          });
          insertedCount++;
        } catch (error: any) {
          if (error.code === 11000) {
            // Duplicate key - skip
            skippedCount++;
          } else {
            throw error;
          }
        }
      }
    }

    console.log(`\n✅ Meta seeding complete!`);
    console.log(`   Inserted: ${insertedCount} options`);
    console.log(`   Skipped (duplicates): ${skippedCount} options`);
    console.log(`\n📝 Categories seeded:`);
    console.log(`   • ins_type, ins_status_add`);
    console.log(`   • insurance_company, insurance_dealer`);
    console.log(`   • branch, exicutive_name, city`);
    console.log(`   • nominee_relation (NEW - 22 options)`);
    console.log(`   • vehicle_product, manufacturer, fuel_type`);
    console.log(`   • ncb, addon_coverage`);
    console.log(`   • payment_mode, customer_payment_type`);
    console.log(`   • company_payment_mode, company_bank_name_add\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Meta seeding failed:', error);
    process.exit(1);
  }
};

seedMeta();
