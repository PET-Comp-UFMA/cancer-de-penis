export type AuthUser = {
  id: string;
  username: string;
  roles: string[];
};

export type Session = {
  user: AuthUser | null;
  mustChangePassword: boolean;
  csrfToken: string;
};

export type AuthSuccess = {
  user: AuthUser;
  mustChangePassword: boolean;
  redirectTo?: string;
  csrfToken: string;
};

export async function getSession(): Promise<Session> {
  const response = await fetch("/api/auth/session", {
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Não foi possível verificar a sessão.");
  return response.json() as Promise<Session>;
}

async function readError(response: Response) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || "Não foi possível concluir a operação.";
  } catch {
    return "Não foi possível concluir a operação.";
  }
}

export async function login(username: string, password: string, csrfToken: string) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    const error = new Error(await readError(response));
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
  return response.json() as Promise<AuthSuccess>;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  csrfToken: string,
) {
  const response = await fetch("/api/auth/change-password", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!response.ok) {
    const error = new Error(await readError(response));
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
  return response.json() as Promise<AuthSuccess>;
}

export async function logout(csrfToken: string) {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const error = new Error(await readError(response));
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
}
