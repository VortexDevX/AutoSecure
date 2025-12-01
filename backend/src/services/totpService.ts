import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { ValidationError } from '../utils/errors';

const TOTP_WINDOW = parseInt(process.env.TOTP_WINDOW || '2', 10);
const TOTP_ISSUER = process.env.TOTP_ISSUER || 'AutoSecure';

export interface TOTPSecret {
  secret: string; // base32 encoded
  otpauth_url: string;
  qr_code: string; // base64 data URL
}

export class TOTPService {
  /**
   * Generate a new TOTP secret
   */
  static async generateSecret(email: string): Promise<TOTPSecret> {
    const secret = speakeasy.generateSecret({
      name: `${TOTP_ISSUER} (${email})`,
      issuer: TOTP_ISSUER,
      length: 20,
    });

    if (!secret.otpauth_url) {
      throw new Error('Failed to generate TOTP secret');
    }

    // Generate QR code as data URL
    const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      otpauth_url: secret.otpauth_url,
      qr_code: qrCodeDataURL,
    };
  }

  /**
   * Verify a TOTP token
   */
  static verify(token: string, secret: string): boolean {
    // Remove spaces and ensure 6 digits
    const cleanToken = token.replace(/\s/g, '');

    if (!/^\d{6}$/.test(cleanToken)) {
      throw new ValidationError('TOTP code must be 6 digits');
    }

    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: cleanToken,
      window: TOTP_WINDOW, // Allow 2 time steps before/after for clock skew
    });
  }

  /**
   * Generate a TOTP token (for testing/debugging)
   */
  static generate(secret: string): string {
    return speakeasy.totp({
      secret: secret,
      encoding: 'base32',
    });
  }
}
