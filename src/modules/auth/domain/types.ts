export type AuthRole = 'admin' | 'responsavel';
export type AuthUser = { id: string; username: string; roles: AuthRole[] };
export type SessionUser = AuthUser & { mustChangePassword: boolean };
export type AuthContext = { user: SessionUser; sessionId: string };
