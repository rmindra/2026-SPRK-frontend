import type { ApiErrorBody } from '@/types'

const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_BASE_URL
  if (typeof url !== 'string' || url === '') {
    throw new Error('VITE_API_BASE_URL is not set')
  }
  return url.replace(/\/$/, '')
}

/**
 * Thrown when the API returns 4xx or 5xx. Contains status and parsed body (e.g. backend message).
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorBody | null,
    message?: string
  ) {
    super(message ?? body?.message ?? `Request failed with status ${status}`)
    this.name = 'ApiError'
  }
}

async function parseResponse<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get('content-type')
  const text = await response.text()
  if (!text) return null
  if (contentType?.includes('application/json')) {
    try {
      return JSON.parse(text) as T
    } catch {
      return null
    }
  }
  return null
}

/**
 * Central HTTP client. All request URLs use VITE_API_BASE_URL.
 * On 4xx/5xx, throws ApiError with status and parsed body (backend message).
 */
export async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const base = getBaseUrl()
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    const body = await parseResponse<ApiErrorBody>(response)
    throw new ApiError(response.status, body, body?.message)
  }

  const data = await parseResponse<T>(response)
  return data as T
}

export async function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' })
}

export async function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: body != null ? JSON.stringify(body) : undefined })
}

export async function put<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'PUT', body: body != null ? JSON.stringify(body) : undefined })
}

export async function patch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'PATCH', body: body != null ? JSON.stringify(body) : undefined })
}

export async function del(path: string): Promise<void> {
  await request(path, { method: 'DELETE' })
}
