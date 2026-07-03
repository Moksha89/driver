import { clearToken, getStoredToken } from './storage';
import { API_BASE_URL } from './env';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  redirectOn401?: boolean;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof (data as { error?: unknown }).error === 'string'
        ? (data as { error: string }).error
        : response.statusText || 'Request failed';

    throw new ApiError(response.status, message);
  }

  return data as T;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}) {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 401 && options.redirectOn401 !== false && typeof window !== 'undefined') {
    clearToken();
    window.location.assign('/login');
  }

  return parseResponse<T>(response);
}
