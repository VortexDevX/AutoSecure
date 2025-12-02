import * as Brevo from '@getbrevo/brevo';
import { AppError } from '../utils/errors';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

class SMTPService {
  private client: Brevo.TransactionalEmailsApi;

  constructor() {
    this.client = new Brevo.TransactionalEmailsApi();

    if (!process.env.BREVO_API_KEY) {
      console.error('❌ BREVO_API_KEY missing in env');
    }

    this.client.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY as string
    );

    console.log('📨 Brevo Email API initialized (HTTP-based, no SMTP)');
  }

  async sendEmail(options: EmailOptions) {
    const { to, subject, html, attachments } = options;

    try {
      const payload: Brevo.SendSmtpEmail = {
        sender: {
          name: process.env.SMTP_FROM_NAME,
          email: process.env.SMTP_FROM_EMAIL,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        attachment: attachments?.map((att) => ({
          name: att.filename,
          content: att.content.toString('base64'),
        })),
      };

      const response = await this.client.sendTransacEmail(payload);

      console.log(`✅ Email sent via Brevo API to ${to}`);
      return {
        id: response.body?.messageId || 'brevo-api',
        messageId: response.body?.messageId || 'brevo-api',
      };
    } catch (error: any) {
      console.error('❌ Brevo API email failed:', error.message || error);
      throw new AppError(`Email sending failed: ${error.message}`, 500);
    }
  }
}

export const smtpService = new SMTPService();
