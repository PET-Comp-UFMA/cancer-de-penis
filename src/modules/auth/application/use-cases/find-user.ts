import type { FindUserCommand } from '../dto/find-user';
import type { FindUserPort } from '../ports/find-user';

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,64}$/;

export async function findUserId(port: FindUserPort, command: FindUserCommand): Promise<string | null> {
  const username = typeof command.username === 'string' ? command.username.trim() : '';
  if (!USERNAME_PATTERN.test(username)) throw new Error('INVALID_REQUEST');
  return port.findUserId(username);
}

export const createFindUserId = (port: FindUserPort) => (command: FindUserCommand) => findUserId(port, command);
