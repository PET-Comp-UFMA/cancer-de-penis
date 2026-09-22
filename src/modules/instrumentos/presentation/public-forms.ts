export type PublicForm = {
  id: string;
  catalogKey: string;
  title: string;
  description: string;
  imageDataUrl?: string | null;
  definition?: { imageDataUrl?: string | null };
};

export type PublicFormsResponse = {
  forms: PublicForm[];
  page: number;
  pageSize: number;
  total: number;
  publishedTotal: number;
  totalPages: number;
};

export class PublicFormsApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "PublicFormsApiError";
  }
}

export async function getPublishedForms({
  search,
  page,
  pageSize,
  signal,
}: {
  search: string;
  page: number;
  pageSize: number;
  signal?: AbortSignal;
}): Promise<PublicFormsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (search.trim()) params.set("search", search.trim());

  const response = await fetch(`/api/formularios/publicados?${params.toString()}`, {
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    let message = "Não foi possível carregar as avaliações publicadas.";
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // Keep the generic message when the response is not JSON.
    }
    throw new PublicFormsApiError(message, response.status);
  }

  return response.json() as Promise<PublicFormsResponse>;
}

export async function getPublishedForm(catalogKey: string, signal?: AbortSignal): Promise<PublicForm> {
  const response = await fetch(`/api/formularios/publicados/${encodeURIComponent(catalogKey)}`, {
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) throw new PublicFormsApiError("Não foi possível carregar o formulário publicado.", response.status);
  const value = await response.json() as PublicForm;
  return { ...value, imageDataUrl: value.imageDataUrl ?? value.definition?.imageDataUrl ?? null };
}
