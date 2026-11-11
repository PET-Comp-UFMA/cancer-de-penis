import type { AuthContext } from '../../domain/types';
import type { CreatedSession } from '../dto/results';

/** Adapter owns session checks, password verification, hashing and transactions. */
export interface ChangePasswordPort {
  changePassword(context: AuthContext, currentPassword: string, newPassword: string): Promise<CreatedSession | null>;
}
