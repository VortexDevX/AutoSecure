import { Types } from 'mongoose';
import { EmailLog, EmailTemplate, Policy, SiteSettings, Meta } from '../models';
import { LicenseRecord } from '../models/LicenseRecord';
import { smtpService } from './smtpService';
import { FileStorageService } from './fileStorageService';
import { AppError } from '../utils/errors';

interface SendBackupEmailOptions {
  policyId: string | Types.ObjectId;
  selectedAttachments: string[];
  uploadedFiles: Express.Multer.File[];
  userId: string | Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
}

interface SendLicenseBackupEmailOptions {
  licenseId: string | Types.ObjectId;
  selectedAttachments: string[];
  uploadedFiles: Express.Multer.File[];
  userId: string | Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
}

// Default company info (fallback if DB not available)
const DEFAULT_COMPANY_INFO = {
  company_name: 'AutoSecure Insurance',
  company_email: process.env.COMPANY_EMAIL || 'support@autosecure.com',
  company_phone: process.env.COMPANY_PHONE || '+91 98765 43210',
  company_address: process.env.COMPANY_ADDRESS || 'Mumbai, Maharashtra',
  company_tagline: 'Your Trusted Insurance Partner',
};

export const emailService = {
  /**
   * Fetch branding/company info from SiteSettings
   */
  async getCompanyInfo(): Promise<typeof DEFAULT_COMPANY_INFO> {
    try {
      const settings = await SiteSettings.findOne();

      if (settings && settings.branding) {
        return {
          company_name: settings.branding.company_name || DEFAULT_COMPANY_INFO.company_name,
          company_email: process.env.COMPANY_EMAIL || DEFAULT_COMPANY_INFO.company_email,
          company_phone: process.env.COMPANY_PHONE || DEFAULT_COMPANY_INFO.company_phone,
          company_address: process.env.COMPANY_ADDRESS || DEFAULT_COMPANY_INFO.company_address,
          company_tagline: DEFAULT_COMPANY_INFO.company_tagline,
        };
      }

      return DEFAULT_COMPANY_INFO;
    } catch (error) {
      console.warn('Failed to fetch company info from DB, using defaults');
      return DEFAULT_COMPANY_INFO;
    }
  },

  /**
   * Fetch all meta options and create a lookup map
   * Returns a map: { "category:value": "label" }
   */
  async getMetaLookup(): Promise<Map<string, string>> {
    try {
      const metas = await Meta.find({ active: true }).lean();
      const lookup = new Map<string, string>();

      for (const meta of metas) {
        // Store with category prefix for specificity
        lookup.set(`${meta.category}:${meta.value}`, meta.label);
        // Also store without category for general lookup
        lookup.set(String(meta.value), meta.label);
      }

      return lookup;
    } catch (error) {
      console.warn('Failed to fetch meta lookup:', error);
      return new Map();
    }
  },

  /**
   * Format a value to display label
   * 1. Try to find in meta lookup
   * 2. If not found, convert snake_case to Title Case
   */
  formatValueToLabel(value: any, metaLookup: Map<string, string>, category?: string): string {
    if (!value || value === 'N/A') return 'N/A';

    const strValue = String(value);

    // Try category-specific lookup first
    if (category) {
      const categoryLabel = metaLookup.get(`${category}:${strValue}`);
      if (categoryLabel) return categoryLabel;
    }

    // Try general lookup
    const generalLabel = metaLookup.get(strValue);
    if (generalLabel) return generalLabel;

    // Fallback: convert snake_case/kebab-case to Title Case
    return strValue
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim();
  },

  /**
   * Check rate limits before sending (for policies)
   */
  async checkRateLimit(
    policyId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<{ allowed: boolean; message?: string; waitMinutes?: number }> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const policyEmailCount = await EmailLog.countDocuments({
      policy_id: policyId,
      sent_at: { $gte: oneHourAgo },
      status: 'sent',
    });

    if (policyEmailCount >= 50) {
      const oldestEmail = await EmailLog.findOne({
        policy_id: policyId,
        sent_at: { $gte: oneHourAgo },
        status: 'sent',
      }).sort({ sent_at: 1 });

      const waitTime = oldestEmail
        ? Math.ceil((oldestEmail.sent_at!.getTime() + 60 * 60 * 1000 - now.getTime()) / 60000)
        : 20;

      return {
        allowed: false,
        message: `Rate limit exceeded for this policy. Maximum 50 emails per hour.`,
        waitMinutes: waitTime,
      };
    }

    const userEmailCount = await EmailLog.countDocuments({
      sent_by: userId,
      sent_at: { $gte: oneHourAgo },
      status: 'sent',
    });

    if (userEmailCount >= 300) {
      const oldestEmail = await EmailLog.findOne({
        sent_by: userId,
        sent_at: { $gte: oneHourAgo },
        status: 'sent',
      }).sort({ sent_at: 1 });

      const waitTime = oldestEmail
        ? Math.ceil((oldestEmail.sent_at!.getTime() + 60 * 60 * 1000 - now.getTime()) / 60000)
        : 60;

      return {
        allowed: false,
        message: `Rate limit exceeded. Maximum 300 emails per hour per user.`,
        waitMinutes: waitTime,
      };
    }

    return { allowed: true };
  },

  /**
   * Check rate limits for licenses
   */
  async checkLicenseRateLimit(
    licenseId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<{ allowed: boolean; message?: string; waitMinutes?: number }> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const licenseEmailCount = await EmailLog.countDocuments({
      license_id: licenseId,
      sent_at: { $gte: oneHourAgo },
      status: 'sent',
    });

    if (licenseEmailCount >= 50) {
      const oldestEmail = await EmailLog.findOne({
        license_id: licenseId,
        sent_at: { $gte: oneHourAgo },
        status: 'sent',
      }).sort({ sent_at: 1 });

      const waitTime = oldestEmail
        ? Math.ceil((oldestEmail.sent_at!.getTime() + 60 * 60 * 1000 - now.getTime()) / 60000)
        : 20;

      return {
        allowed: false,
        message: `Rate limit exceeded for this license. Maximum 50 emails per hour.`,
        waitMinutes: waitTime,
      };
    }

    const userEmailCount = await EmailLog.countDocuments({
      sent_by: userId,
      sent_at: { $gte: oneHourAgo },
      status: 'sent',
    });

    if (userEmailCount >= 300) {
      const oldestEmail = await EmailLog.findOne({
        sent_by: userId,
        sent_at: { $gte: oneHourAgo },
        status: 'sent',
      }).sort({ sent_at: 1 });

      const waitTime = oldestEmail
        ? Math.ceil((oldestEmail.sent_at!.getTime() + 60 * 60 * 1000 - now.getTime()) / 60000)
        : 60;

      return {
        allowed: false,
        message: `Rate limit exceeded. Maximum 300 emails per hour per user.`,
        waitMinutes: waitTime,
      };
    }

    return { allowed: true };
  },

  /**
   * Format date for email display
   */
  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  },

  /**
   * Format currency for email display
   */
  formatCurrency(amount: any): string {
    if (amount === null || amount === undefined || amount === '') return 'N/A';
    const num = parseFloat(amount);
    if (isNaN(num)) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  },

  /**
   * Build variables object from policy data with proper labels
   */
  async buildTemplateVariables(policy: any): Promise<Record<string, string>> {
    const formatDate = this.formatDate;
    const formatCurrency = this.formatCurrency;

    // Fetch company info and meta lookup
    const [companyInfo, metaLookup] = await Promise.all([
      this.getCompanyInfo(),
      this.getMetaLookup(),
    ]);

    // Helper to format value with meta lookup
    const formatValue = (value: any, category?: string): string => {
      return this.formatValueToLabel(value, metaLookup, category);
    };

    return {
      // Policy Details
      policy_no: policy.policy_no || 'N/A',
      serial_no: policy.serial_no || 'N/A',
      issue_date: formatDate(policy.issue_date),
      ins_type: formatValue(policy.ins_type, 'ins_type'),
      ins_co_id: formatValue(policy.ins_co_id, 'ins_co_id'),
      insurance_dealer: formatValue(policy.insurance_dealer, 'insurance_dealer'),
      start_date: formatDate(policy.start_date),
      end_date: formatDate(policy.end_date),
      ins_status: formatValue(policy.ins_status, 'ins_status_add'),
      inspection: policy.inspection === 'yes' ? 'Yes' : 'No',
      saod_start_date: formatDate(policy.saod_start_date),
      saod_end_date: formatDate(policy.saod_end_date),

      // Customer Details
      customer: policy.customer || 'N/A',
      mobile_no: policy.mobile_no || 'N/A',
      mobile_no_two: policy.mobile_no_two || 'N/A',
      email: policy.email || 'N/A',
      address_1: policy.address_1 || 'N/A',
      city_id: formatValue(policy.city_id, 'city_id'),
      branch_id: formatValue(policy.branch_id, 'branch_id'),
      exicutive_name: formatValue(policy.exicutive_name, 'exicutive_name'),
      adh_id: policy.adh_id || 'N/A',
      pan_no: policy.pan_no || 'N/A',
      nominee_name: policy.nominee_name || 'N/A',
      nominee_dob: formatDate(policy.nominee_dob),
      nominee_relation: formatValue(policy.nominee_relation, 'nominee_relation'),

      // Vehicle Details
      product: formatValue(policy.product, 'product'),
      manufacturer: formatValue(policy.manufacturer, 'manufacturer'),
      model_name: formatValue(policy.model_name, 'model_name'),
      fuel_type: formatValue(policy.fuel_type, 'fuel_type'),
      registration_number: policy.registration_number || 'N/A',
      registration_date: formatDate(policy.registration_date),
      engine_no: policy.engine_no || 'N/A',
      chassis_no: policy.chassis_no || 'N/A',
      mfg_date: policy.mfg_date,
      hypothecation: policy.hypothecation || 'None',

      // Premium Details
      sum_insured: formatCurrency(policy.sum_insured),
      net_premium: formatCurrency(policy.net_premium),
      od_premium: formatCurrency(policy.od_premium),
      premium_amount: formatCurrency(policy.premium_amount),
      ncb: formatValue(policy.ncb, 'ncb'),
      cng_value: formatCurrency(policy.cng_value),
      discounted_value: formatCurrency(policy.discounted_value),
      on_date_premium: formatCurrency(policy.on_date_premium),
      agent_commission: formatCurrency(policy.agent_commission),
      addon_coverage: Array.isArray(policy.addon_coverage)
        ? policy.addon_coverage
            .map((addon: string) => formatValue(addon, 'addon_coverage'))
            .join(', ')
        : 'None',

      // Payment Details
      customer_payment_type: formatValue(policy.customer_payment_type, 'customer_payment_type'),
      customer_payment_status: policy.customer_payment_status === 'done' ? 'Paid' : 'Pending',
      voucher_no: policy.voucher_no || 'N/A',
      extra_amount: formatCurrency(policy.extra_amount),
      company_payment_mode: formatValue(policy.company_payment_mode, 'company_payment_mode'),
      company_bank_name: formatValue(policy.company_bank_name, 'company_bank_name'),
      company_cheque_no: policy.company_cheque_no || 'N/A',
      company_amount: formatCurrency(policy.company_amount),
      company_cheque_date: formatDate(policy.company_cheque_date),

      // Previous Policy Details
      previous_policy_no: policy.previous_policy_no || 'N/A',
      previous_policy_company: formatValue(policy.previous_policy_company, 'ins_co_id'),
      previous_policy_expiry_date: formatDate(policy.previous_policy_expiry_date),
      previous_policy_ncb: formatValue(policy.previous_policy_ncb, 'ncb'),
      previous_policy_claim: policy.previous_policy_claim === 'yes' ? 'Yes' : 'No',

      // Company Info
      ...companyInfo,

      // System
      current_date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      current_year: new Date().getFullYear().toString(),
    };
  },

  /**
   * Build variables object from license data
   */
  async buildLicenseTemplateVariables(license: any): Promise<Record<string, string>> {
    const formatDate = this.formatDate;
    const formatCurrency = this.formatCurrency;
    const companyInfo = await this.getCompanyInfo();

    return {
      // License Details
      lic_no: license.lic_no || 'N/A',
      application_no: license.application_no || 'N/A',
      expiry_date: formatDate(license.expiry_date),
      work_process: license.work_process || 'N/A',
      faceless_type: license.faceless_type
        ? license.faceless_type.charAt(0).toUpperCase() + license.faceless_type.slice(1)
        : 'N/A',
      approved: license.approved ? 'Yes' : 'No',

      // Customer Details
      customer_name: license.customer_name || 'N/A',
      dob: formatDate(license.dob),
      mobile_no: license.mobile_no || 'N/A',
      aadhar_no: license.aadhar_no || 'N/A',
      customer_address: license.customer_address || 'N/A',

      // Reference Details
      reference: license.reference || 'N/A',
      reference_mobile_no: license.reference_mobile_no || 'N/A',

      // Financial Details
      fee: formatCurrency(license.fee),
      agent_fee: formatCurrency(license.agent_fee),
      customer_payment: formatCurrency(license.customer_payment),
      profit: formatCurrency(license.profit),

      // Company Info
      ...companyInfo,

      // System
      current_date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      current_year: new Date().getFullYear().toString(),
    };
  },

  /**
   * Replace template variables with actual values
   */
  substituteVariables(template: string, variables: Record<string, string>): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || 'N/A');
    }

    return result;
  },

  /**
   * Get email template from database or use fallback
   */
  async getEmailTemplate(
    templateId: string = 'premium_details'
  ): Promise<{ subject: string; body_html: string } | null> {
    try {
      const template = await EmailTemplate.findOne({
        template_id: templateId,
        active: true,
      });

      if (template) {
        return {
          subject: template.subject,
          body_html: template.body_html,
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching email template:', error);
      return null;
    }
  },

  /**
   * Generate fallback HTML if no template in database (for policies)
   */
  async generateFallbackHTML(policy: any, variables: Record<string, string>): Promise<string> {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; }
    h1 { color: #3B82F6; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
    th { color: #666; font-weight: normal; }
    td { color: #333; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Policy Details</h1>
    <p>Dear ${variables.customer},</p>
    <p>Here are your policy details:</p>
    
    <h3>Policy Information</h3>
    <table>
      <tr><th>Policy Number</th><td>${variables.policy_no}</td></tr>
      <tr><th>Insurance Type</th><td>${variables.ins_type}</td></tr>
      <tr><th>Insurance Company</th><td>${variables.ins_co_id}</td></tr>
      <tr><th>Policy Period</th><td>${variables.start_date} - ${variables.end_date}</td></tr>
      <tr><th>Premium Amount</th><td>${variables.premium_amount}</td></tr>
    </table>
    
    <h3>Vehicle Information</h3>
    <table>
      <tr><th>Product</th><td>${variables.product}</td></tr>
      <tr><th>Vehicle</th><td>${variables.manufacturer} ${variables.model_name}</td></tr>
      <tr><th>Registration</th><td>${variables.registration_number}</td></tr>
      <tr><th>Fuel Type</th><td>${variables.fuel_type}</td></tr>
    </table>
    
    <h3>Payment Status</h3>
    <table>
      <tr><th>Payment Status</th><td>${variables.customer_payment_status}</td></tr>
      <tr><th>NCB</th><td>${variables.ncb}</td></tr>
    </table>
    
    <p>Thank you for choosing ${variables.company_name}.</p>
    <p>${variables.company_phone} | ${variables.company_email}</p>
  </div>
</body>
</html>
    `;
  },

  /**
   * Generate fallback HTML for license emails
   */
  async generateLicenseFallbackHTML(
    license: any,
    variables: Record<string, string>
  ): Promise<string> {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f0f4f8; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .header p { margin: 10px 0 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 30px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
    .info-grid { display: table; width: 100%; }
    .info-row { display: table-row; }
    .info-label { display: table-cell; padding: 10px 15px 10px 0; color: #6b7280; font-size: 14px; width: 40%; vertical-align: top; }
    .info-value { display: table-cell; padding: 10px 0; color: #1f2937; font-weight: 500; font-size: 14px; }
    .highlight-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .highlight-box .label { color: #0369a1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
    .highlight-box .value { color: #0c4a6e; font-size: 24px; font-weight: 700; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 5px 0; color: #6b7280; font-size: 12px; }
    .footer .company { font-weight: 600; color: #374151; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚗 License Record Details</h1>
      <p>Backup Email • Generated on ${variables.current_date}</p>
    </div>
    
    <div class="content">
      <div class="highlight-box">
        <div class="label">License Number</div>
        <div class="value">${variables.lic_no}</div>
      </div>

      <div class="section">
        <div class="section-title">📋 License Information</div>
        <div class="info-grid">
          <div class="info-row">
            <div class="info-label">Application No</div>
            <div class="info-value">${variables.application_no}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Expiry Date</div>
            <div class="info-value">${variables.expiry_date}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Work Process</div>
            <div class="info-value">${variables.work_process}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Type</div>
            <div class="info-value">${variables.faceless_type}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Status</div>
            <div class="info-value">${variables.approved}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">👤 Customer Information</div>
        <div class="info-grid">
          <div class="info-row">
            <div class="info-label">Name</div>
            <div class="info-value">${variables.customer_name}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Date of Birth</div>
            <div class="info-value">${variables.dob}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Mobile No</div>
            <div class="info-value">${variables.mobile_no}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Aadhar No</div>
            <div class="info-value">${variables.aadhar_no}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Address</div>
            <div class="info-value">${variables.customer_address}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">📞 Reference Details</div>
        <div class="info-grid">
          <div class="info-row">
            <div class="info-label">Reference Name</div>
            <div class="info-value">${variables.reference}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Reference Mobile</div>
            <div class="info-value">${variables.reference_mobile_no}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">💰 Financial Details</div>
        <div class="info-grid">
          <div class="info-row">
            <div class="info-label">Fee</div>
            <div class="info-value">${variables.fee}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Agent Fee</div>
            <div class="info-value">${variables.agent_fee}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Customer Payment</div>
            <div class="info-value">${variables.customer_payment}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Profit</div>
            <div class="info-value">${variables.profit}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p class="company">${variables.company_name}</p>
      <p>${variables.company_address}</p>
      <p>📞 ${variables.company_phone} | ✉️ ${variables.company_email}</p>
      <p style="margin-top: 15px; color: #9ca3af;">This is an automated backup email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `;
  },

  /**
   * Fetch file from R2 storage (for policies)
   */
  async fetchFileFromStorage(
    folderId: string,
    fileName: string
  ): Promise<{ content: Buffer; mimeType: string } | null> {
    try {
      const normalizedFolderId = String(folderId || '').trim();
      const normalizedFileName = String(fileName || '').trim();
      const fileId = `${normalizedFolderId}/${normalizedFileName}`;

      const exists = await FileStorageService.fileExists(fileId);
      if (!exists) {
        console.warn(`⚠️ File not found in R2: ${fileId}`);
        return null;
      }

      const content = await FileStorageService.downloadFile(fileId);
      const metadata = await FileStorageService.getFileMetadata(fileId);

      return {
        content,
        mimeType: metadata.contentType,
      };
    } catch (error: any) {
      console.error(`Failed to fetch file from R2: ${fileName}`, error.message);
      return null;
    }
  },

  /**
   * Fetch license file from storage
   */
  async fetchLicenseFileFromStorage(
    folderName: string,
    fileName: string
  ): Promise<{ content: Buffer; mimeType: string } | null> {
    try {
      const fileId = `licenses/${folderName}/${fileName}`;

      const exists = await FileStorageService.licenseFileExists(fileId);
      if (!exists) {
        console.warn(`⚠️ License file not found: ${fileId}`);
        return null;
      }

      const content = await FileStorageService.downloadLicenseFile(fileId);
      const metadata = await FileStorageService.getLicenseFileMetadata(fileId);

      return {
        content,
        mimeType: metadata.contentType,
      };
    } catch (error: any) {
      console.error(`Failed to fetch license file: ${fileName}`, error.message);
      return null;
    }
  },

  /**
   * Send policy backup email with attachments
   */
  async sendBackupEmail(options: SendBackupEmailOptions): Promise<void> {
    const { policyId, selectedAttachments, uploadedFiles, userId, ipAddress, userAgent } = options;

    console.log('📧 emailService.sendBackupEmail called:', {
      policyId,
      selectedAttachments,
      uploadedFilesCount: uploadedFiles.length,
    });

    const policyObjId = typeof policyId === 'string' ? new Types.ObjectId(policyId) : policyId;
    const userObjId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    const rateLimitCheck = await this.checkRateLimit(policyObjId, userObjId);
    if (!rateLimitCheck.allowed) {
      throw new AppError(
        `${rateLimitCheck.message} Please try again in ${rateLimitCheck.waitMinutes} minutes.`,
        429
      );
    }

    const policy = await Policy.findById(policyObjId);
    if (!policy) {
      throw new AppError('Policy not found', 404);
    }

    const recipientEmail = process.env.BACKUP_EMAIL;
    if (!recipientEmail) {
      throw new AppError('BACKUP_EMAIL not configured in environment', 500);
    }

    // Build template variables with proper labels
    const variables = await this.buildTemplateVariables(policy);
    const template = await this.getEmailTemplate('premium_details');

    let subject: string;
    let htmlBody: string;

    if (template) {
      subject = this.substituteVariables(template.subject, variables);
      htmlBody = this.substituteVariables(template.body_html, variables);
      console.log('✅ Using database template for email');
    } else {
      subject = `Policy Details: ${policy.policy_no} - ${policy.customer}`;
      htmlBody = await this.generateFallbackHTML(policy, variables);
      console.log('⚠️ Using fallback template (no active template in database)');
    }

    const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];

    console.log('📎 Processing selected attachments:', selectedAttachments);

    for (const attachment of selectedAttachments) {
      try {
        if (attachment === 'adh_file' && policy.adh_file) {
          console.log('📄 Fetching Aadhaar file from R2:', policy.adh_file.file_name);

          const fileData = await this.fetchFileFromStorage(
            policy.drive_folder_id || policy.policy_no,
            policy.adh_file.file_name
          );

          if (fileData) {
            const ext = policy.adh_file.mime_type.split('/')[1] || 'pdf';
            attachments.push({
              filename: `Aadhaar_${policy.adh_id || 'doc'}.${ext}`,
              content: fileData.content,
              contentType: fileData.mimeType,
            });
            console.log('✅ Aadhaar file attached');
          }
        } else if (attachment === 'pan_file' && policy.pan_file) {
          console.log('📄 Fetching PAN file from R2:', policy.pan_file.file_name);

          const fileData = await this.fetchFileFromStorage(
            policy.drive_folder_id || policy.policy_no,
            policy.pan_file.file_name
          );

          if (fileData) {
            const ext = policy.pan_file.mime_type.split('/')[1] || 'pdf';
            attachments.push({
              filename: `PAN_${policy.pan_no || 'doc'}.${ext}`,
              content: fileData.content,
              contentType: fileData.mimeType,
            });
            console.log('✅ PAN file attached');
          }
        } else if (attachment.startsWith('other_doc_') && policy.other_documents) {
          const index = parseInt(attachment.replace('other_doc_', ''), 10);
          const doc = policy.other_documents[index];

          if (doc) {
            console.log(`📄 Fetching other doc [${index}] from R2:`, doc.file_name);

            const fileData = await this.fetchFileFromStorage(
              policy.drive_folder_id || policy.policy_no,
              doc.file_name
            );

            if (fileData) {
              const ext = doc.mime_type.split('/')[1] || 'pdf';
              attachments.push({
                filename: `${doc.label}.${ext}`,
                content: fileData.content,
                contentType: fileData.mimeType,
              });
              console.log(`✅ Other doc [${doc.label}] attached`);
            }
          }
        }
      } catch (error: any) {
        console.warn(`⚠️ Failed to attach ${attachment}:`, error.message);
      }
    }

    console.log('📎 Processing uploaded files:', uploadedFiles.length);
    for (const file of uploadedFiles) {
      attachments.push({
        filename: file.originalname,
        content: file.buffer,
        contentType: file.mimetype,
      });
      console.log(`✅ Uploaded file attached: ${file.originalname}`);
    }

    console.log(`📧 Total attachments: ${attachments.length}`);

    const emailLog = await EmailLog.create({
      policy_id: policyObjId,
      template_id: 'premium_details',
      sent_to: recipientEmail,
      subject,
      status: 'pending',
      sent_by: userObjId,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    try {
      const { messageId } = await smtpService.sendEmail({
        to: recipientEmail,
        subject,
        html: htmlBody,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      emailLog.status = 'sent';
      emailLog.resend_id = messageId;
      emailLog.sent_at = new Date();
      await emailLog.save();

      console.log(`✅ Backup email sent successfully to ${recipientEmail}`);
      console.log(`   Message ID: ${messageId}`);
      console.log(`   Attachments: ${attachments.length}`);
    } catch (error: any) {
      emailLog.status = 'failed';
      emailLog.error_message = error.message;
      await emailLog.save();

      console.error(`❌ Failed to send backup email to ${recipientEmail}:`, error);
      throw new AppError(`Failed to send email: ${error.message}`, 500);
    }
  },

  /**
   * Send license backup email with attachments
   */
  async sendLicenseBackupEmail(options: SendLicenseBackupEmailOptions): Promise<void> {
    const { licenseId, selectedAttachments, uploadedFiles, userId, ipAddress, userAgent } = options;

    console.log('📧 emailService.sendLicenseBackupEmail called:', {
      licenseId,
      selectedAttachments,
      uploadedFilesCount: uploadedFiles.length,
    });

    const licenseObjId = typeof licenseId === 'string' ? new Types.ObjectId(licenseId) : licenseId;
    const userObjId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    const rateLimitCheck = await this.checkLicenseRateLimit(licenseObjId, userObjId);
    if (!rateLimitCheck.allowed) {
      throw new AppError(
        `${rateLimitCheck.message} Please try again in ${rateLimitCheck.waitMinutes} minutes.`,
        429
      );
    }

    const license = await LicenseRecord.findById(licenseObjId);
    if (!license) {
      throw new AppError('License not found', 404);
    }

    const recipientEmail = process.env.BACKUP_EMAIL;
    if (!recipientEmail) {
      throw new AppError('BACKUP_EMAIL not configured in environment', 500);
    }

    const variables = await this.buildLicenseTemplateVariables(license);
    const template = await this.getEmailTemplate('license_details');

    let subject: string;
    let htmlBody: string;

    if (template) {
      subject = this.substituteVariables(template.subject, variables);
      htmlBody = this.substituteVariables(template.body_html, variables);
      console.log('✅ Using database template for license email');
    } else {
      subject = `License Details: ${license.lic_no} - ${license.customer_name || 'Customer'}`;
      htmlBody = await this.generateLicenseFallbackHTML(license, variables);
      console.log('⚠️ Using fallback template for license email');
    }

    const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];
    const folderName = license.lic_no.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();

    console.log('📎 Processing selected license attachments:', selectedAttachments);

    for (const attachmentId of selectedAttachments) {
      try {
        if (attachmentId.startsWith('doc_')) {
          const index = parseInt(attachmentId.replace('doc_', ''), 10);
          const doc = license.documents[index];

          if (doc) {
            console.log(`📄 Fetching license doc [${index}]:`, doc.file_name);

            const fileData = await this.fetchLicenseFileFromStorage(folderName, doc.file_name);

            if (fileData) {
              const ext = doc.mime_type.split('/')[1] || 'pdf';
              const label = doc.label || `Document_${index + 1}`;
              attachments.push({
                filename: `${label}.${ext}`,
                content: fileData.content,
                contentType: fileData.mimeType,
              });
              console.log(`✅ License doc [${label}] attached`);
            }
          }
        }
      } catch (error: any) {
        console.warn(`⚠️ Failed to attach license document ${attachmentId}:`, error.message);
      }
    }

    console.log('📎 Processing uploaded files:', uploadedFiles.length);
    for (const file of uploadedFiles) {
      attachments.push({
        filename: file.originalname,
        content: file.buffer,
        contentType: file.mimetype,
      });
      console.log(`✅ Uploaded file attached: ${file.originalname}`);
    }

    console.log(`📧 Total attachments: ${attachments.length}`);

    const emailLog = await EmailLog.create({
      license_id: licenseObjId,
      template_id: 'license_details',
      sent_to: recipientEmail,
      subject,
      status: 'pending',
      sent_by: userObjId,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    try {
      const { messageId } = await smtpService.sendEmail({
        to: recipientEmail,
        subject,
        html: htmlBody,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      emailLog.status = 'sent';
      emailLog.resend_id = messageId;
      emailLog.sent_at = new Date();
      await emailLog.save();

      console.log(`✅ License backup email sent successfully to ${recipientEmail}`);
      console.log(`   Message ID: ${messageId}`);
      console.log(`   Attachments: ${attachments.length}`);
    } catch (error: any) {
      emailLog.status = 'failed';
      emailLog.error_message = error.message;
      await emailLog.save();

      console.error(`❌ Failed to send license backup email to ${recipientEmail}:`, error);
      throw new AppError(`Failed to send email: ${error.message}`, 500);
    }
  },

  /**
   * Get email logs for a policy
   */
  async getEmailLogs(policyId: string | Types.ObjectId, limit = 10) {
    const policyObjId = typeof policyId === 'string' ? new Types.ObjectId(policyId) : policyId;

    return EmailLog.find({ policy_id: policyObjId })
      .sort({ sent_at: -1 })
      .limit(limit)
      .populate('sent_by', 'email role')
      .lean();
  },

  /**
   * Get email logs for a license
   */
  async getLicenseEmailLogs(licenseId: string | Types.ObjectId, limit = 10) {
    const licenseObjId = typeof licenseId === 'string' ? new Types.ObjectId(licenseId) : licenseId;

    return EmailLog.find({ license_id: licenseObjId })
      .sort({ sent_at: -1 })
      .limit(limit)
      .populate('sent_by', 'email role')
      .lean();
  },
};
