import { Types } from 'mongoose';
import { EmailLog, EmailTemplate, Policy, SiteSettings } from '../models';
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
   * Check rate limits before sending
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

    if (policyEmailCount >= 3) {
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
        message: `Rate limit exceeded for this policy. Maximum 3 emails per hour.`,
        waitMinutes: waitTime,
      };
    }

    const userEmailCount = await EmailLog.countDocuments({
      sent_by: userId,
      sent_at: { $gte: oneHourAgo },
      status: 'sent',
    });

    if (userEmailCount >= 20) {
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
        message: `Rate limit exceeded. Maximum 20 emails per hour per user.`,
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
   * Build variables object from policy data
   */
  async buildTemplateVariables(policy: any): Promise<Record<string, string>> {
    const formatDate = this.formatDate;

    // ✅ Fetch company info from DB
    const companyInfo = await this.getCompanyInfo();

    return {
      // Policy Details
      policy_no: policy.policy_no || 'N/A',
      serial_no: policy.serial_no || 'N/A',
      issue_date: formatDate(policy.issue_date),
      ins_type: policy.ins_type || 'N/A',
      ins_co_id: policy.ins_co_id || 'N/A',
      start_date: formatDate(policy.start_date),
      end_date: formatDate(policy.end_date),
      ins_status: policy.ins_status || 'N/A',
      inspection: policy.inspection === 'yes' ? 'Yes' : 'No',

      // Customer Details
      customer: policy.customer || 'N/A',
      mobile_no: policy.mobile_no || 'N/A',
      email: policy.email || 'N/A',
      address_1: policy.address_1 || 'N/A',
      city_id: policy.city_id || 'N/A',
      branch_id: policy.branch_id || 'N/A',
      exicutive_name: policy.exicutive_name || 'N/A',
      nominee_name: policy.nominee_name || 'N/A',
      nominee_relation: policy.nominee_relation || 'N/A',

      // Vehicle Details
      product: policy.product || 'N/A',
      manufacturer: policy.manufacturer || '',
      model_name: policy.model_name || '',
      fuel_type: policy.fuel_type || 'N/A',
      registration_number: policy.registration_number || 'N/A',
      registration_date: formatDate(policy.registration_date),
      engine_no: policy.engine_no || 'N/A',
      chassis_no: policy.chassis_no || 'N/A',
      mfg_date: formatDate(policy.mfg_date),
      hypothecation: policy.hypothecation || 'None',

      // ✅ Company Info (from DB)
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
   * Generate fallback HTML if no template in database
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
      <tr><th>Policy Period</th><td>${variables.start_date} - ${variables.end_date}</td></tr>
    </table>
    
    <h3>Vehicle Information</h3>
    <table>
      <tr><th>Vehicle</th><td>${variables.manufacturer} ${variables.model_name}</td></tr>
      <tr><th>Registration</th><td>${variables.registration_number}</td></tr>
    </table>
    
    <p>Thank you for choosing ${variables.company_name}.</p>
  </div>
</body>
</html>
    `;
  },

  /**
   * Fetch file from R2 storage
   */
  async fetchFileFromStorage(
    policyNo: string,
    fileName: string
  ): Promise<{ content: Buffer; mimeType: string } | null> {
    try {
      const fileId = `${policyNo}/${fileName}`;

      // Check if file exists
      const exists = await FileStorageService.fileExists(fileId);
      if (!exists) {
        console.warn(`⚠️ File not found in R2: ${fileId}`);
        return null;
      }

      // Download file from R2
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

    // Check rate limits
    const rateLimitCheck = await this.checkRateLimit(policyObjId, userObjId);
    if (!rateLimitCheck.allowed) {
      throw new AppError(
        `${rateLimitCheck.message} Please try again in ${rateLimitCheck.waitMinutes} minutes.`,
        429
      );
    }

    // Fetch policy
    const policy = await Policy.findById(policyObjId);
    if (!policy) {
      throw new AppError('Policy not found', 404);
    }

    // Get recipient email from environment
    const recipientEmail = process.env.BACKUP_EMAIL;
    if (!recipientEmail) {
      throw new AppError('BACKUP_EMAIL not configured in environment', 500);
    }

    // Build template variables (now async to fetch company info)
    const variables = await this.buildTemplateVariables(policy);

    // Get template from database
    const template = await this.getEmailTemplate('premium_details');

    let subject: string;
    let htmlBody: string;

    if (template) {
      // Use database template with variable substitution
      subject = this.substituteVariables(template.subject, variables);
      htmlBody = this.substituteVariables(template.body_html, variables);
      console.log('✅ Using database template for email');
    } else {
      // Use fallback
      subject = `Policy Details: ${policy.policy_no} - ${policy.customer}`;
      htmlBody = await this.generateFallbackHTML(policy, variables);
      console.log('⚠️ Using fallback template (no active template in database)');
    }

    // Prepare attachments
    const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];

    console.log('📎 Processing selected attachments:', selectedAttachments);

    // Add selected existing attachments (from R2)
    for (const attachment of selectedAttachments) {
      try {
        if (attachment === 'adh_file' && policy.adh_file) {
          console.log('📄 Fetching Aadhaar file from R2:', policy.adh_file.file_name);

          const fileData = await this.fetchFileFromStorage(
            policy.policy_no,
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
            policy.policy_no,
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

            const fileData = await this.fetchFileFromStorage(policy.policy_no, doc.file_name);

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

    // Add uploaded files (these are already in memory)
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

    // Create email log (pending)
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
};
