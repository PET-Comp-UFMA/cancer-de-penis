import type { AuthRole, AuthUser, SessionUser } from '../../domain/types';

/** The application-facing result of creating a session. */
export type CreatedSession = {
  token: string;
  sessionId: string;
  user: SessionUser;
};

/** The application-facing result of provisioning an account. */
export type CreatedAccount = Pick<AuthUser, 'id' | 'username' | 'roles'>;

export type ProvisionedRoles = AuthRole[];
