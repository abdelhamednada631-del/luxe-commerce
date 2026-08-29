'use client';

/**
 * Thin fetch wrapper for admin API routes.
 * Throws ApiError with a machine-readable code for UI handling.
 */
export class ApiError extends Error {
  code: string;
  status: number;
  fieldErrors?: Record<string, string>;
  retryAfterSeconds?: number;
  detail?: string;

  constructor(
    code: string,
    status: number,
    fieldErrors?: Record<string, string>,
    retryAfterSeconds?: number,
    detail?: string
  ) {
    super(code);
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.retryAfterSeconds = retryAfterSeconds;
    this.detail = detail;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { ...init?.headers } });
  const data = (await res.json().catch(() => null)) as
    | (T & {
        error?: string;
        fieldErrors?: Record<string, string>;
        retryAfterSeconds?: number;
        detail?: string;
      })
    | null;

  if (!res.ok) {
    throw new ApiError(
      data?.error ?? `http_${res.status}`,
      res.status,
      data?.fieldErrors,
      data?.retryAfterSeconds,
      data?.detail
    );
  }
  return data as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    }),
  put: <T>(url: string, body: unknown) =>
    request<T>(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }),
  del: <T>(url: string) => request<T>(url, { method: 'DELETE' })
};

/** Upload one image file through the media pipeline. Returns the media id. */
export async function uploadImage(file: File): Promise<number> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/admin/media', { method: 'POST', body: form });
  const data = (await res.json().catch(() => null)) as
    | { ok?: boolean; media?: { id: number }; error?: string }
    | null;

  if (!res.ok || !data?.media) {
    const code = data?.error ?? `http_${res.status}`;
    if (code === 'too_large') throw new ApiError('fileTooLarge', res.status);
    if (code === 'invalid_type' || code === 'decode_failed') throw new ApiError('invalidFileType', res.status);
    throw new ApiError(code, res.status);
  }
  return data.media.id;
}
