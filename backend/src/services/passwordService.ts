import bcrypt from 'bcrypt';
import { validatePassword } from '../utils/validators';
import { ValidationError } from '../utils/errors';

const SALT_ROUNDS = 12;

export class PasswordService {
  /**
   * Hash a password
   */
  static async hash(password: string): Promise<string> {
    const validation = validatePassword(password);
    if (!validation.valid) {
      throw new ValidationError(validation.errors.join(', '));
    }

    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compare password with hash
   */
  static async compare(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength (without hashing)
   */
  static validate(password: string): { valid: boolean; errors: string[] } {
    return validatePassword(password);
  }
}
