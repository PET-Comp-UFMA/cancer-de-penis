export type FormStatus = "draft" | "published";
export type FormDefinitionState = "incomplete" | "complete";

export type FormListItem = {
  id: string;
  title: string;
  description: string;
  status: FormStatus;
  definitionState: FormDefinitionState;
  updatedAt: string;
};

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
