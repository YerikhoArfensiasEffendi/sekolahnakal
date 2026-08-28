import { env } from '@/config/env';
import type { ApiError } from '@/types/api';

/**
 * Lightweight fetch wrapper.
 * Handles auth headers, JSON parsing, error normalization.
 */

class ApiClient {
  private baseUrl: string;
  private getToken: (() => string | null) | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /** Set token getter for auth header injection */
  setTokenGetter(getter: () => string | null): void {
    this.getToken = getter;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken?.();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const error: ApiError = {
          message: errorBody.message ?? `Request failed with status ${response.status}`,
          status: response.status,
          code: errorBody.code,
        };
        throw error;
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      return await response.json();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw { message: 'Request timed out', status: 408 } satisfies ApiError;
      }
      // Re-throw ApiError as-is
      if (typeof err === 'object' && err !== null && 'status' in err) {
        throw err;
      }
      throw { message: 'Network error', status: 0 } satisfies ApiError;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(env.API_BASE_URL);
