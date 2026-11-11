import { createChangePassword } from './use-cases/change-password';
import { createDisableUser } from './use-cases/disable-user';
import { createFindUserId } from './use-cases/find-user';
import { createLogin } from './use-cases/login';
import { createProvisionUser } from './use-cases/provision-user';
import { createResetPassword } from './use-cases/reset-password';
import type { ChangePasswordPort } from './ports/change-password';
import type { DisableUserPort } from './ports/disable-user';
import type { FindUserPort } from './ports/find-user';
import type { LoginPort } from './ports/login';
import type { ProvisionUserPort } from './ports/provision-user';
import type { ResetPasswordPort } from './ports/reset-password';
import type { SessionRepository } from './ports/session-repository';

export type AuthApplicationDependencies = {
  login: LoginPort;
  changePassword: ChangePasswordPort;
  provisionUser: ProvisionUserPort;
  resetPassword: ResetPasswordPort;
  disableUser: DisableUserPort;
  findUserId: FindUserPort;
  session: SessionRepository;
};

export function createAuthApplication(dependencies: AuthApplicationDependencies) {
  return {
    login: createLogin(dependencies.login),
    changePassword: createChangePassword(dependencies.changePassword),
    provisionUser: createProvisionUser(dependencies.provisionUser),
    resetPassword: createResetPassword(dependencies.resetPassword),
    disableUser: createDisableUser(dependencies.disableUser),
    findUserId: createFindUserId(dependencies.findUserId),
    session: dependencies.session,
  };
}
