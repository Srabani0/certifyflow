export const API_URL =
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_PUBLIC_API_URL ??
  'http://localhost:4000/api';

export function buildQueryString(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  isFormData?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getHeaders(isFormData = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  const token = typeof window !== 'undefined' ? localStorage.getItem('cf_token') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, isFormData = false } = options;

  const baseUrl = API_URL.replace(/\/$/, '');
  const headers = getHeaders(isFormData);

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    credentials: 'include',
    headers,
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload: unknown = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.error === 'string' ? payload.error : `Request failed with status ${response.status}`;
    const details = isRecord(payload) ? payload.details : undefined;
    throw new ApiError(message, response.status, details);
  }

  return payload as T;
}

export async function apiBlobRequest(path: string, options: RequestOptions = {}): Promise<Blob> {
  const { method = 'GET', body } = options;

  const baseUrl = API_URL.replace(/\/$/, '');
  const headers = getHeaders(false);

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    credentials: 'include',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload: unknown = await response.json();
      if (isRecord(payload) && typeof payload.error === 'string') {
        message = payload.error;
      }
    } catch {
      // response had no JSON body; keep the default message
    }
    throw new ApiError(message, response.status);
  }

  return response.blob();
}
