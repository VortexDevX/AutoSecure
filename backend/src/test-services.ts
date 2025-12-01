import { PasswordService } from './services/passwordService';
import { JWTService } from './services/jwtService';
import { TOTPService } from './services/totpService';

const testServices = async () => {
  console.log('\n🧪 Testing Services...\n');

  // Test 1: Password Service
  console.log('1️⃣ Password Service:');
  try {
    const password = 'Test@12345';
    const hash = await PasswordService.hash(password);
    console.log('   ✅ Password hashed');

    const valid = await PasswordService.compare(password, hash);
    console.log('   ✅ Password verified:', valid);

    const weakPassword = '123';
    const validation = PasswordService.validate(weakPassword);
    console.log('   ✅ Weak password detected:', validation.errors);
  } catch (error) {
    console.error('   ❌ Password service error:', error);
  }

  // Test 2: JWT Service
  console.log('\n2️⃣ JWT Service:');
  try {
    const payload = {
      userId: '123',
      email: 'test@example.com',
      role: 'user' as const,
    };

    const tokens = JWTService.generateTokenPair(payload);
    console.log('   ✅ Tokens generated');

    const decoded = JWTService.verifyAccessToken(tokens.accessToken);
    console.log('   ✅ Access token verified:', decoded.email);

    const decodedRefresh = JWTService.verifyRefreshToken(tokens.refreshToken);
    console.log('   ✅ Refresh token verified:', decodedRefresh.email);
  } catch (error) {
    console.error('   ❌ JWT service error:', error);
  }

  // Test 3: TOTP Service
  console.log('\n3️⃣ TOTP Service:');
  try {
    const totpData = await TOTPService.generateSecret('test@example.com');
    console.log('   ✅ TOTP secret generated');
    console.log('   Secret:', totpData.secret);
    console.log('   QR Code (truncated):', totpData.qr_code.substring(0, 50) + '...');

    const token = TOTPService.generate(totpData.secret);
    console.log('   ✅ TOTP token generated:', token);

    const verified = TOTPService.verify(token, totpData.secret);
    console.log('   ✅ TOTP verified:', verified);
  } catch (error) {
    console.error('   ❌ TOTP service error:', error);
  }

  console.log('\n✅ All service tests complete!\n');
};

testServices();
