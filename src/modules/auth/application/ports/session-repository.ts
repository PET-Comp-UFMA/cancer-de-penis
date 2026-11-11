import type { AuthContext } from '../../domain/types';

export interface SessionRepository {
  findSession(token: string): Promise<AuthContext | null>;
  revoke(token: string): Promise<void>;
}
