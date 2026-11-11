import type { DisableUserCommand } from '../dto/disable-user';
import type { DisableUserPort } from '../ports/disable-user';

export async function disableUser(port: DisableUserPort, command: DisableUserCommand): Promise<boolean> {
  return port.disableUser(command.id);
}

export const createDisableUser = (port: DisableUserPort) => (command: DisableUserCommand) => disableUser(port, command);
