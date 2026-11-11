import type { AuthRole } from '../../domain/types';
import type { ProvisionUserCommand } from '../dto/provision-user';
import type { CreatedAccount } from '../dto/results';
import type { ProvisionUserPort } from '../ports/provision-user';

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,64}$/;
const ROLES: AuthRole[] = ['admin', 'responsavel'];

function isRoles(value: unknown): value is AuthRole[] {
  return Array.isArray(value) && value.length > 0 && value.every((role) => typeof role === 'string' && ROLES.includes(role as AuthRole));
}

export async function provisionUser(port: ProvisionUserPort, command: ProvisionUserCommand): Promise<CreatedAccount> {
  const username = typeof command.username === 'string' ? command.username.trim() : '';
  const roles = command.roles === undefined ? ['admin'] as AuthRole[] : command.roles;
  if (!USERNAME_PATTERN.test(username) || typeof command.password !== 'string'
    || command.password.length < 12 || command.password.length > 128 || !isRoles(roles)) {
    throw new Error('INVALID_REQUEST');
  }
  return port.provisionUser(username, command.password, roles);
}

export const createProvisionUser = (port: ProvisionUserPort) => (command: ProvisionUserCommand) => provisionUser(port, command);
