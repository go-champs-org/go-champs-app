import { HttpClient, HttpRequest, HttpResponse } from './HttpClient';

export class FetchHttpClient implements HttpClient {
  async request<T = unknown>({ endpoint, method = 'GET', headers }: HttpRequest): Promise<HttpResponse<T>> {
    const response = await fetch(endpoint, {
      method,
      headers,
    });

    const data = (await response.json()) as T;

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  }
}

