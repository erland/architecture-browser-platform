export type ApiErrorPayload = {
  message?: string;
  details?: string[];
};

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function mergeHeaders(init?: RequestInit): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(init?.headers ?? {}),
  };
}

export async function readErrorMessage(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
  const baseMessage = payload?.message ?? `Request failed with status ${response.status}`;
  const details = payload?.details?.length ? ` ${payload.details.join(" ")}` : "";
  return `${baseMessage}.${details}`.trim();
}

export function createHttpClient(fetchImpl: FetchLike) {
  async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
    const response = await fetchImpl(input, {
      headers: mergeHeaders(init),
      ...init,
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    return (await response.json()) as T;
  }

  async function fetchNoContent(input: RequestInfo | URL, init?: RequestInit): Promise<void> {
    const response = await fetchImpl(input, {
      headers: mergeHeaders(init),
      ...init,
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }
  }

  return {
    fetchJson,
    fetchNoContent,
  };
}

export const httpClient = createHttpClient(fetch);
