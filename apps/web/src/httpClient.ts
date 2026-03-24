export type ApiErrorPayload = {
  message?: string;
  details?: string[];
};

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export class HttpError extends Error {
  status: number;
  details: string[];

  constructor(status: number, message: string, details?: string[]) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details ?? [];
  }
}

function mergeHeaders(init?: RequestInit): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(init?.headers ?? {}),
  };
}

export async function readErrorPayload(response: Response): Promise<ApiErrorPayload | null> {
  return (await response.json().catch(() => null)) as ApiErrorPayload | null;
}

export async function readErrorMessage(response: Response): Promise<string> {
  const payload = await readErrorPayload(response);
  const baseMessage = payload?.message ?? `Request failed with status ${response.status}`;
  const details = payload?.details?.length ? ` ${payload.details.join(" ")}` : "";
  return `${baseMessage}.${details}`.trim();
}

async function throwHttpError(response: Response): Promise<never> {
  const payload = await readErrorPayload(response);
  const baseMessage = payload?.message ?? `Request failed with status ${response.status}`;
  const details = payload?.details ?? [];
  const detailText = details.length ? ` ${details.join(' ')}` : '';
  throw new HttpError(response.status, `${baseMessage}.${detailText}`.trim(), details);
}

export function createHttpClient(fetchImpl: FetchLike) {
  async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
    const response = await fetchImpl(input, {
      headers: mergeHeaders(init),
      ...init,
    });

    if (!response.ok) {
      await throwHttpError(response);
    }

    return (await response.json()) as T;
  }

  async function fetchNoContent(input: RequestInfo | URL, init?: RequestInit): Promise<void> {
    const response = await fetchImpl(input, {
      headers: mergeHeaders(init),
      ...init,
    });

    if (!response.ok) {
      await throwHttpError(response);
    }
  }

  return {
    fetchJson,
    fetchNoContent,
  };
}

export const httpClient = createHttpClient(fetch);
