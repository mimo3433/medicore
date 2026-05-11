import bcrypt from 'bcryptjs';
import { config } from '../config';

export class PasswordUtils {
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(config.bcrypt.saltRounds);
    return bcrypt.hash(password, salt);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
