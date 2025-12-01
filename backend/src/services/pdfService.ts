import puppeteer from 'puppeteer';
import { Policy, SiteSettings } from '../models';
import { AppError } from '../utils/errors';
import path from 'path';
import fs from 'fs/promises';
import { Types } from 'mongoose';

export const pdfService = {
  /**
   * Generate policy PDF
   */
  async generatePolicyPDF(policyId: string | Types.ObjectId): Promise<Buffer> {
    const policy = await Policy.findById(policyId).populate('created_by', 'email full_name');

    if (!policy) {
      throw new AppError('Policy not found', 404);
    }

    // Get branding settings
    const settings = await SiteSettings.findOne();
    const branding = settings?.branding || {
      company_name: 'AutoSecure',
      logo_path: 'storage/branding/logo.png',
      primary_color: '#3B82F6',
      secondary_color: '#10B981',
      accent_color: '#F59E0B',
      footer_text: '© 2025 AutoSecure. All rights reserved.',
    };

    // Read logo file as base64
    let logoBase64 = '';
    const logoPath = path.join(process.cwd(), branding.logo_path || 'storage/branding/logo.png');
    try {
      const logoBuffer = await fs.readFile(logoPath);
      const ext = path.extname(logoPath).substring(1);
      logoBase64 = `data:image/${ext};base64,${logoBuffer.toString('base64')}`;
    } catch (error) {
      console.warn('⚠️  Logo not found, using placeholder');
      logoBase64 = ''; // Will show company name only
    }

    // Generate HTML
    const html = this.generatePolicyHTML(policy, branding, logoBase64);

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  },

  /**
   * Generate HTML template for policy PDF
   */
  generatePolicyHTML(policy: any, branding: any, logoBase64: string): string {
    const formatDate = (date: Date | undefined) =>
      date ? new Date(date).toLocaleDateString('en-IN') : '-';
    const formatCurrency = (amount: number | undefined) =>
      amount !== undefined ? `₹ ${amount.toLocaleString('en-IN')}` : '-';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Policy - ${policy.policy_no}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1F2937;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 3px solid ${branding.primary_color};
      margin-bottom: 30px;
    }
    
    .logo-section {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .logo {
      max-width: 80px;
      max-height: 80px;
    }
    
    .company-name {
      font-size: 24pt;
      font-weight: 700;
      color: ${branding.primary_color};
    }
    
    .policy-title {
      text-align: right;
    }
    
    .policy-title h1 {
      font-size: 18pt;
      color: #111827;
      margin-bottom: 5px;
    }
    
    .policy-title .policy-no {
      font-size: 14pt;
      color: ${branding.accent_color};
      font-weight: 600;
    }
    
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 14pt;
      font-weight: 600;
      color: ${branding.primary_color};
      border-bottom: 2px solid ${branding.secondary_color};
      padding-bottom: 8px;
      margin-bottom: 15px;
    }
    
    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px 20px;
    }
    
    .detail-item {
      display: flex;
      padding: 6px 0;
      border-bottom: 1px solid #E5E7EB;
    }
    
    .detail-label {
      font-weight: 600;
      color: #6B7280;
      min-width: 180px;
      flex-shrink: 0;
    }
    
    .detail-value {
      color: #111827;
      word-break: break-word;
    }
    
    .highlight-box {
      background: linear-gradient(135deg, ${branding.primary_color}15, ${branding.secondary_color}15);
      border-left: 4px solid ${branding.primary_color};
      padding: 15px;
      margin: 20px 0;
      border-radius: 6px;
    }
    
    .premium-amount {
      font-size: 20pt;
      font-weight: 700;
      color: ${branding.primary_color};
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #E5E7EB;
      text-align: center;
      color: #6B7280;
      font-size: 9pt;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 9pt;
      font-weight: 600;
      background-color: ${branding.secondary_color}20;
      color: ${branding.secondary_color};
    }
    
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" class="logo" />` : ''}
      <div class="company-name">${branding.company_name}</div>
    </div>
    <div class="policy-title">
      <h1>Insurance Policy</h1>
      <div class="policy-no">${policy.policy_no}</div>
      <div style="font-size: 10pt; color: #6B7280; margin-top: 5px;">
        Serial: ${policy.serial_no || '-'}
      </div>
      <div style="font-size: 10pt; color: #6B7280; margin-top: 5px;">
        Issue Date: ${formatDate(policy.issue_date)}
      </div>
    </div>
  </div>

  <!-- Policy Information -->
  <div class="section">
    <h2 class="section-title">📋 Policy Information</h2>
    <div class="details-grid">
      <div class="detail-item">
        <span class="detail-label">Serial Number:</span>
        <span class="detail-value">${policy.serial_no || '-'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Policy Number:</span>
        <span class="detail-value"><strong>${policy.policy_no}</strong></span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Insurance Type:</span>
        <span class="detail-value">${policy.ins_type || '-'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Status:</span>
        <span class="detail-value">
          <span class="status-badge">${policy.ins_status || '-'}</span>
        </span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Policy Period:</span>
        <span class="detail-value">${formatDate(policy.start_date)} to ${formatDate(policy.end_date)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Insurance Company:</span>
        <span class="detail-value">${policy.ins_co_id || '-'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Branch:</span>
        <span class="detail-value">${policy.branch_id || '-'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Executive:</span>
        <span class="detail-value">${policy.exicutive_name || '-'}</span>
      </div>
    </div>
  </div>

  <!-- Customer Details -->
  <div class="section">
    <h2 class="section-title">👤 Customer Details</h2>
    <div class="details-grid">
      <div class="detail-item">
        <span class="detail-label">Name:</span>
        <span class="detail-value"><strong>${policy.customer}</strong></span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Mobile:</span>
        <span class="detail-value">${policy.mobile_no || '-'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Email:</span>
        <span class="detail-value">${policy.email || '-'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">City:</span>
        <span class="detail-value">${policy.city_id || '-'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">PAN Number:</span>
        <span class="detail-value">${policy.pan_no || '-'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Aadhaar Number:</span>
        <span class="detail-value">${policy.adh_id || '-'}</span>
      </div>
      <div class="detail-item" style="grid-column: 1 / -1;">
        <span class="detail-label">Address:</span>
        <span class="detail-value">${policy.address_1 || '-'}</span>
      </div>
    </div>
  </div>

  <!-- Vehicle Details -->
  <div class="section">
    <h2 class="section-title">🚗 Vehicle Details</h2>
    <div class="details-grid">
      <div class="detail-item">
        <span class="detail-label">Manufacturer:</span>
        <span class="detail-value">${policy.manufacturer || '-'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Model:</span>
        <span class="detail-value">${policy.model_name || '-'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Registration No:</span>
        <span class="detail-value"><strong>${policy.registration_number}</strong></span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Registration Date:</span>
        <span class="detail-value">${formatDate(policy.registration_date)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Engine Number:</span>
        <span class="detail-value">${policy.engine_no || '-'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Chassis Number:</span>
        <span class="detail-value">${policy.chassis_no || '-'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Manufacturing Date:</span>
        <span class="detail-value">${formatDate(policy.mfg_date)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Hypothecation:</span>
        <span class="detail-value">${policy.hypothecation || 'None'}</span>
      </div>
    </div>
  </div>

  <!-- Premium Details -->
  <div class="section">
    <h2 class="section-title">💰 Premium Details</h2>
    <div class="details-grid">
      <div class="detail-item">
        <span class="detail-label">Sum Insured:</span>
        <span class="detail-value">${formatCurrency(policy.sum_insured)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">CNG Value:</span>
        <span class="detail-value">${formatCurrency(policy.cng_value)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Discounted Value:</span>
        <span class="detail-value">${formatCurrency(policy.discounted_value)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">NCB:</span>
        <span class="detail-value">${policy.ncb || '-'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Net Premium:</span>
        <span class="detail-value">${formatCurrency(policy.net_premium)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">On Date Premium:</span>
        <span class="detail-value">${formatCurrency(policy.on_date_premium)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Agent Commission:</span>
        <span class="detail-value">${formatCurrency(policy.agent_commission)}</span>
      </div>
    </div>
    
    ${
      policy.previous_policy_no
        ? `
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px dashed #E5E7EB;">
      <h3 style="font-size: 12pt; color: ${branding.primary_color}; margin-bottom: 10px;">Previous Policy Details</h3>
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Previous Policy No:</span>
          <span class="detail-value">${policy.previous_policy_no || '-'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Previous Company:</span>
          <span class="detail-value">${policy.previous_policy_company || '-'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Previous Expiry Date:</span>
          <span class="detail-value">${formatDate(policy.previous_policy_expiry_date)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Previous NCB:</span>
          <span class="detail-value">${policy.previous_policy_ncb || '-'}</span>
        </div>
      </div>
    </div>
    `
        : ''
    }
    
    <div class="highlight-box">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 14pt; font-weight: 600;">Total Premium Amount:</span>
        <span class="premium-amount">${formatCurrency(policy.premium_amount)}</span>
      </div>
    </div>
  </div>

  <!-- Customer Payment -->
  <div class="section">
    <h2 class="section-title">💳 Customer Payment Details</h2>
    <div class="details-grid">
      <div class="detail-item">
        <span class="detail-label">Payment Type:</span>
        <span class="detail-value">${policy.customer_payment_type || '-'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Payment Status:</span>
        <span class="detail-value">
          <span class="status-badge">${policy.customer_payment_status}</span>
        </span>
      </div>
      ${
        policy.voucher_no
          ? `
      <div class="detail-item">
        <span class="detail-label">Voucher No:</span>
        <span class="detail-value">${policy.voucher_no}</span>
      </div>
      `
          : ''
      }
    </div>
  </div>

  <!-- ✅ RENAMED: Company Payment (formerly Krunal) -->
  <div class="section">
    <h2 class="section-title">🏦 Company Payment Details</h2>
    <div class="details-grid">
      <div class="detail-item">
        <span class="detail-label">Payment Mode:</span>
        <span class="detail-value">${policy.company_payment_mode || '-'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Bank Name:</span>
        <span class="detail-value">${policy.company_bank_name || '-'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Amount:</span>
        <span class="detail-value">${formatCurrency(policy.company_amount)}</span>
      </div>
      ${
        policy.company_cheque_no
          ? `
      <div class="detail-item">
        <span class="detail-label">Cheque Number:</span>
        <span class="detail-value">${policy.company_cheque_no}</span>
      </div>
      `
          : ''
      }
      ${
        policy.company_cheque_date
          ? `
      <div class="detail-item">
        <span class="detail-label">Cheque Date:</span>
        <span class="detail-value">${formatDate(policy.company_cheque_date)}</span>
      </div>
      `
          : ''
      }
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>${branding.footer_text}</p>
    <p style="margin-top: 10px; font-size: 8pt;">
      This is a system-generated document. Generated on ${new Date().toLocaleString('en-IN')}
    </p>
  </div>
</body>
</html>
    `;
  },

  /**
   * Save PDF to storage
   */
  async savePolicyPDF(policyId: string | Types.ObjectId, pdfBuffer: Buffer): Promise<string> {
    const policy = await Policy.findById(policyId);
    if (!policy) {
      throw new AppError('Policy not found', 404);
    }

    const policyFolder = path.join(
      process.env.FILE_STORAGE_PATH || './storage',
      'policies',
      policy.policy_no
    );

    // Ensure folder exists
    await fs.mkdir(policyFolder, { recursive: true });

    const pdfPath = path.join(policyFolder, `policy_${policy.policy_no}.pdf`);
    await fs.writeFile(pdfPath, pdfBuffer);

    return pdfPath;
  },
};
