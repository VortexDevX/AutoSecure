import { connectDatabase } from '../config/database';
import { smtpService } from '../services/smtpService';

async function testEmail() {
  try {
    await connectDatabase();
    console.log('📧 Testing SMTP connection...\n');

    const testRecipient = process.argv[2] || 'patelvaibhav020406@gmail.com';

    await smtpService.sendTestEmail(testRecipient);

    console.log('\n✅ Test email sent successfully!');
    console.log(`   Check inbox: ${testRecipient}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Test email failed:', error);
    process.exit(1);
  }
}

testEmail();
