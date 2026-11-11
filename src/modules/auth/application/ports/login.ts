import type { CreatedSession } from '../dto/results';

/** Adapter owns rate limits, credential verification, locking and transactions. */
export interface LoginPort {
  login(username: string, password: string, source?: string): Promise<CreatedSession | null>;
}
