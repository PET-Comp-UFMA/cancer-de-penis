import type { ChangePasswordCommand } from '../dto/change-password';
import type { CreatedSession } from '../dto/results';
import type { ChangePasswordPort } from '../ports/change-password';

export async function changePassword(port: ChangePasswordPort, command: ChangePasswordCommand): Promise<CreatedSession | null> {
  if (typeof command.currentPassword !== 'string' || command.currentPassword.length < 1 || command.currentPassword.length > 128
    || typeof command.newPassword !== 'string' || command.newPassword.length < 12 || command.newPassword.length > 128
    || command.currentPassword === command.newPassword) {
    throw new Error('INVALID_PASSWORD');
  }
  return port.changePassword(command.context, command.currentPassword, command.newPassword);
}

export const createChangePassword = (port: ChangePasswordPort) => (command: ChangePasswordCommand) => changePassword(port, command);
