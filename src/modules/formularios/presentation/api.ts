import type {
  DefinitionState,
  FormDefinition,
  FormDetail,
  FormListItem,
} from "../domain/types";

export type { DefinitionState, FormDefinition, FormDetail, FormListItem, FormQuestionType, FormStatus } from "../domain/types";
export type FormDefinitionState = DefinitionState;

export type FormsListResponse = {
  forms: FormListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export class FormsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "FormsApiError";
  }
}

export async function getForms({
  search,
  page,
  pageSize,
  signal,
}: {
  search: string;
  page: number;
  pageSize: number;
  signal?: AbortSignal;
}): Promise<FormsListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (search.trim()) params.set("search", search.trim());

  const response = await fetch(`/api/formularios?${params.toString()}`, {
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    let message = "Não foi possível carregar seus formulários.";
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // Keep a generic message when the server response is not JSON.
    }
    throw new FormsApiError(message, response.status);
  }

  return response.json() as Promise<FormsListResponse>;
}

export async function createForm(csrfToken: string, definition?: FormDefinition): Promise<FormDetail> {
  const response = await fetch('/api/formularios', { method: 'POST', credentials: 'same-origin',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify(definition ? { definition } : {}), });
  if (!response.ok) {
    let message = 'Não foi possível criar o formulário.';
    try { message = ((await response.json()) as { error?: string }).error || message; } catch { /* keep fallback */ }
    throw new FormsApiError(message, response.status);
  }
  return response.json() as Promise<FormDetail>;
}

export async function getForm(formId: string, signal?: AbortSignal): Promise<FormDetail> {
  const response = await fetch(`/api/formularios/${encodeURIComponent(formId)}`, { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' }, signal });
  if (!response.ok) {
    let message = 'Não foi possível carregar o formulário.';
    try { message = ((await response.json()) as { error?: string }).error || message; } catch { /* keep fallback */ }
    throw new FormsApiError(message, response.status);
  }
  return response.json() as Promise<FormDetail>;
}

export async function saveFormDefinition(formId: string, definition: FormDefinition, expectedRevision: number, csrfToken: string): Promise<FormDetail> {
  const response = await sendFormMutation(formId, csrfToken, 'PATCH', { definition, expectedRevision });
  return response.json() as Promise<FormDetail>;
}

async function sendFormMutation(
  formId: string,
  csrfToken: string,
  method: "PATCH" | "DELETE",
  body?: object,
) {
  const response = await fetch(`/api/formularios/${encodeURIComponent(formId)}`, {
    method,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify(body ?? {}),
  });

  if (!response.ok) {
    let message = "Não foi possível atualizar o formulário.";
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) message = payload.error;
    } catch {
      // Keep the generic message when the server response is not JSON.
    }
    throw new FormsApiError(message, response.status);
  }

  return response;
}

export async function updateFormStatus(
  formId: string,
  status: FormListItem["status"],
  csrfToken: string,
  expectedRevision: number,
): Promise<FormListItem> {
  const response = await sendFormMutation(formId, csrfToken, "PATCH", {
    status,
    expectedRevision,
  });
  return response.json() as Promise<FormListItem>;
}

export async function deleteForm(formId: string, csrfToken: string): Promise<void> {
  await sendFormMutation(formId, csrfToken, "DELETE");
}
