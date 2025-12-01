import { z } from 'zod';

// ✅ PAN validation (optional)
export const panSchema = z
  .string()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g., ABCDE1234F)')
  .optional()
  .or(z.literal(''));

// ✅ Aadhaar validation (optional)
export const aadhaarSchema = z
  .string()
  .regex(/^[0-9]{12}$/, 'Aadhaar must be 12 digits')
  .optional()
  .or(z.literal(''));

// ✅ Mobile validation (optional)
export const mobileSchema = z
  .string()
  .regex(/^[6-9][0-9]{9}$/, 'Invalid mobile number')
  .optional()
  .or(z.literal(''));

// ✅ Email validation (optional)
export const emailSchema = z.string().email('Invalid email address').optional().or(z.literal(''));

// Password validation
export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain special character');

// ✅ File validation (optional)
export const fileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 10 * 1024 * 1024, 'File must be less than 10MB')
  .refine(
    (file) => ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type),
    'Only PDF, JPG, and PNG files are allowed'
  )
  .optional();

// Helper function to validate file
export const validateFile = (file: File | null | undefined): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: true }; // ✅ Now optional, so no file is valid
  }

  const result = fileSchema.safeParse(file);
  if (!result.success) {
    return { valid: false, error: result.error.issues[0].message };
  }

  return { valid: true };
};

// ✅ NEW: Policy form validation schema
export const policyFormSchema = z.object({
  // Required fields
  policy_no: z.string().min(1, 'Policy number is required'),
  customer: z.string().min(1, 'Customer name is required'),
  registration_number: z.string().min(1, 'Registration number is required'),
  premium_amount: z.number().min(0, 'Premium amount must be positive'),
  customer_payment_status: z.enum(['pending', 'done']),
  ins_type: z.string().min(1, 'Insurance type is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  ins_status: z.string().min(1, 'Insurance status is required'),
  ins_co_id: z.string().min(1, 'Insurance company is required'),
  inspection: z.enum(['yes', 'no']),
  branch_id: z.string().min(1, 'Branch is required'),
  exicutive_name: z.string().min(1, 'Executive name is required'),
  product: z.string().min(1, 'Product is required'),

  // Optional fields
  adh_id: aadhaarSchema,
  pan_no: panSchema,
  mobile_no: mobileSchema,
  email: emailSchema,
  manufacturer: z.string().optional(),
  model_name: z.string().optional(),
  hypothecation: z.string().optional(),
  sum_insured: z.number().optional(),
  ncb: z.string().optional(),
  agent_commission: z.number().optional(),
  previous_policy_no: z.string().optional(),
  previous_policy_company: z.string().optional(),
  previous_policy_ncb: z.string().optional(),
  company_payment_mode: z.string().optional(),
  company_bank_name: z.string().optional(),
  company_amount: z.number().optional(),
});
