import { connectDatabase } from '../config/database';
import { smtpService } from '../services/smtpService';

async function testEmail() {
  try {
    await connectDatabase();
    console.log('📧 Testing Brevo HTTP API email...\n');

    const testRecipient = process.argv[2] || 'patelvaibhav020406@gmail.com';

    // Direct simple API test
    await smtpService.sendEmail({
      to: testRecipient,
      subject: 'AutoSecure - Test Email (HTTP API)',
      html: `
        <h1>Test Email from AutoSecure</h1>
        <p>This is a test email sent using the Brevo HTTP API.</p>
        <p>If you received this, everything is working perfectly.</p>
      `,
    });

    console.log(`\n✅ Test email sent successfully to: ${testRecipient}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Test email failed:', error);
    process.exit(1);
  }
}

testEmail();
