import type { AuthContext } from '../../domain/types';

export type ChangePasswordCommand = {
  context: AuthContext;
  currentPassword: unknown;
  newPassword: unknown;
};
