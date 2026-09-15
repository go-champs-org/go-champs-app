import { TokenProvider } from '../../../core/auth/TokenProvider';
import { API_CONFIG } from '../../../core/config/apiConfig';
import { AppError } from '../../../core/errors/AppError';
import { HttpClient, HttpHeaders } from '../../../core/http/HttpClient';

const nullTokenProvider: TokenProvider = {
  getToken: () => null,
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
      const payload = response.data as { errors?: { detail?: string } } | null;
      const detail = payload && typeof payload === 'object' ? payload.errors?.detail : undefined;
      throw new AppError(detail || `HTTP error! status: ${response.status}`, response.status);
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
