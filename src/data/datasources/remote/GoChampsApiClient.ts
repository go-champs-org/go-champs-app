import { TokenProvider } from '../../../core/auth/TokenProvider';
import { API_CONFIG } from '../../../core/config/apiConfig';
import { AppError, AppFieldErrors } from '../../../core/errors/AppError';
import { HttpClient, HttpHeaders } from '../../../core/http/HttpClient';

const nullTokenProvider: TokenProvider = {
  getToken: () => null,
};

/** Changeset errors come as `{ errors: { field: ["message"] } }`. */
const fieldErrorsFrom = (errors: Record<string, unknown> | undefined): AppFieldErrors | undefined => {
  if (!errors) return undefined;
  const entries = Object.entries(errors).filter(
    (entry): entry is [string, string[]] => Array.isArray(entry[1])
  );
  return entries.length ? Object.fromEntries(entries) : undefined;
};

export class GoChampsApiClient {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly tokenProvider: TokenProvider = nullTokenProvider
  ) {}

  async get<T>(endpoint: string, baseUrl = API_CONFIG.goChampsBaseUrl): Promise<T> {
    return this.requestJson<T>('GET', endpoint, undefined, baseUrl);
  }

  async post<T>(endpoint: string, body?: unknown, baseUrl = API_CONFIG.goChampsBaseUrl): Promise<T> {
    return this.requestJson<T>('POST', endpoint, body, baseUrl);
  }

  async patch<T>(endpoint: string, body?: unknown, baseUrl = API_CONFIG.goChampsBaseUrl): Promise<T> {
    return this.requestJson<T>('PATCH', endpoint, body, baseUrl);
  }

  async put<T>(endpoint: string, body?: unknown, baseUrl = API_CONFIG.goChampsBaseUrl): Promise<T> {
    return this.requestJson<T>('PUT', endpoint, body, baseUrl);
  }

  async delete<T>(endpoint: string, baseUrl = API_CONFIG.goChampsBaseUrl): Promise<T> {
    return this.requestJson<T>('DELETE', endpoint, undefined, baseUrl);
  }

  private async requestJson<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: unknown,
    baseUrl = API_CONFIG.goChampsBaseUrl
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
    const response = await this.httpClient.request<T>({
      endpoint: url,
      method,
      headers: this.buildHeaders(),
      body,
    });

    if (!response.ok) {
      const payload = response.data as { errors?: Record<string, unknown> } | null;
      const errors = payload && typeof payload === 'object' ? payload.errors : undefined;
      const detail = typeof errors?.detail === 'string' ? errors.detail : undefined;
      throw new AppError(
        detail || `HTTP error! status: ${response.status}`,
        response.status,
        fieldErrorsFrom(errors)
      );
    }

    return response.data;
  }

  private buildHeaders(): HttpHeaders {
    const token = this.tokenProvider.getToken();
    return {
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7',
      authorization: `Bearer ${token ?? 'null'}`,
      'content-type': 'application/json',
      origin: 'https://go-champs.com',
      referer: 'https://go-champs.com/',
    };
  }
}
