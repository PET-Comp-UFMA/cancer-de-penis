import type { ResetPasswordCommand } from '../dto/reset-password';
import type { ResetPasswordPort } from '../ports/reset-password';

export async function resetPassword(port: ResetPasswordPort, command: ResetPasswordCommand): Promise<boolean> {
  if (typeof command.id !== 'string' || typeof command.password !== 'string'
    || command.password.length < 12 || command.password.length > 128) {
    throw new Error('INVALID_REQUEST');
  }
  return port.resetPassword(command.id, command.password);
}

export const createResetPassword = (port: ResetPasswordPort) => (command: ResetPasswordCommand) => resetPassword(port, command);
