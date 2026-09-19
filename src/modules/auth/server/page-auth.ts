import type { GetServerSidePropsContext, GetServerSidePropsResult, NextApiResponse } from 'next';
import type { AuthRole, SessionUser } from '../domain/types';
import { findSession } from '../infrastructure/repository';
import { noStore, requestToken } from './cookies';

type Props = { user: SessionUser; mustChangePassword: boolean };
export async function requireAdminPage(
  context: GetServerSidePropsContext,
  options: { allowPasswordChange?: boolean; requiredRole?: AuthRole } = {},
): Promise<GetServerSidePropsResult<Props>> {
  noStore(context.res as NextApiResponse);
  try {
    const token = requestToken(context.req);
    const session = token ? await findSession(token) : null;
    if (!session) return { redirect: { destination: '/admin/login?reason=expired', permanent: false } };
    if (session.user.mustChangePassword && !options.allowPasswordChange) {
      return { redirect: { destination: '/admin/alterar-senha', permanent: false } };
    }
    if (options.requiredRole && !session.user.roles.includes(options.requiredRole)) return { notFound: true };
    if (!session.user.roles.some(role => role === 'admin' || role === 'responsavel')) return { notFound: true };
    return { props: { user: session.user, mustChangePassword: session.user.mustChangePassword } };
  } catch {
    throw new Error('Área administrativa temporariamente indisponível.');
  }
}
