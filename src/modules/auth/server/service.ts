import { createAuthApplication } from '../application/service';
import * as postgresAuth from '../infrastructure/repository';
import type { AuthContext, AuthRole } from '../domain/types';

const application = createAuthApplication({
  login: postgresAuth,
  changePassword: {
    changePassword: (context, currentPassword, newPassword) => postgresAuth.changePassword({
      sessionId: context.sessionId,
      userId: context.user.id,
    }, currentPassword, newPassword),
  },
  provisionUser: postgresAuth,
  resetPassword: postgresAuth,
  disableUser: postgresAuth,
  findUserId: postgresAuth,
  session: postgresAuth,
});

export async function login(username: string, password: string, source = 'local-operation') {
  return application.login({ username, password, source });
}

export async function changePassword(
  context: AuthContext,
  currentPassword: string,
  newPassword: string,
) {
  return application.changePassword({
    context,
    currentPassword,
    newPassword,
  });
}

export async function provisionUser(username: string, password: string, roles: AuthRole[] = ['admin']) {
  return application.provisionUser({ username, password, roles: [...roles] });
}

export async function resetPassword(id: string, password: string) {
  return application.resetPassword({ id, password });
}

export async function disableUser(id: string) {
  return application.disableUser({ id });
}

export async function findUserId(username: string) {
  return application.findUserId({ username });
}

export const findSession = application.session.findSession;
export const revoke = application.session.revoke;
