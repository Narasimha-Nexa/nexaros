/**
 * Base API Client — handles HTTP transport, auth tokens, and error normalization.
 * All customer-web API calls go through this module.
 */
import { useAuthStore } from '@/lib/store/auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// ── Error types ──

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends ApiError {
  constructor(cause: unknown) {
    super('Network error — is the backend running?', 0, 'NETWORK_ERROR', cause);
    this.name = 'NetworkError';
  }
}

// ── Helpers ──

function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  // path can be absolute (http://...) or relative (public/menu/...)
  // We use the API_BASE as the base URL for resolving relative paths
  const base = path.startsWith('http') ? '' : (API_BASE.endsWith('/') ? API_BASE : API_BASE + '/');
  const url = new URL(path, base);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let body: Record<string, unknown> | null = null;
    try {
      body = await response.json();
    } catch {
      // non-JSON error body
    }

    const message =
      (body?.message as string) ||
      (body?.error as string) ||
      `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, body?.code as string | undefined, body);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function request<T>(
  method: string,
  path: string,
  options: {
    body?: unknown;
    params?: Record<string, string | number | boolean | undefined>;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const { body, params, headers: extraHeaders, signal } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...extraHeaders,
  };

  const fetchOptions: RequestInit = {
    method,
    headers,
    signal,
  };

  if (body !== undefined && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(buildUrl(path, params), fetchOptions);
    return handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof TypeError || (error as { name?: string })?.name === 'TypeError') {
      throw new NetworkError(error);
    }
    throw error;
  }
}

// ── Public API client ──

export const apiClient = {
  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>, signal?: AbortSignal) {
    return request<T>('GET', path, { params, signal });
  },

  post<T>(path: string, body?: unknown, params?: Record<string, string | number | boolean | undefined>) {
    return request<T>('POST', path, { body, params });
  },

  patch<T>(path: string, body?: unknown) {
    return request<T>('PATCH', path, { body });
  },

  put<T>(path: string, body?: unknown) {
    return request<T>('PUT', path, { body });
  },

  delete<T>(path: string) {
    return request<T>('DELETE', path);
  },
};
