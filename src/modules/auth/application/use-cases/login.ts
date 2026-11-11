import type { LoginCommand } from '../dto/login';
import type { CreatedSession } from '../dto/results';
import type { LoginPort } from '../ports/login';

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,64}$/;

export async function login(port: LoginPort, command: LoginCommand): Promise<CreatedSession> {
  const username = typeof command.username === 'string' ? command.username.trim() : '';
  if (!USERNAME_PATTERN.test(username)
    || typeof command.password !== 'string' || command.password.length < 1 || command.password.length > 128
    || (command.source !== undefined && typeof command.source !== 'string')) {
    throw new Error('INVALID_REQUEST');
  }
  const result = await port.login(username, command.password, command.source as string | undefined);
  if (!result) throw new Error('INVALID_CREDENTIALS');
  return result;
}

export const createLogin = (port: LoginPort) => (command: LoginCommand) => login(port, command);
