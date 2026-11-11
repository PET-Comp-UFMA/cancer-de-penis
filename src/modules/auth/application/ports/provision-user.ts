import type { AuthRole } from '../../domain/types';
import type { CreatedAccount } from '../dto/results';

/** Adapter owns hashing, uniqueness checks and persistence. */
export interface ProvisionUserPort {
  provisionUser(username: string, password: string, roles: AuthRole[]): Promise<CreatedAccount>;
}
