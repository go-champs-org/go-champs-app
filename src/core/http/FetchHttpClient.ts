import { HttpClient, HttpRequest, HttpResponse } from './HttpClient';

export class FetchHttpClient implements HttpClient {
  async request<T = unknown>({ endpoint, method = 'GET', headers, body }: HttpRequest): Promise<HttpResponse<T>> {
    const response = await fetch(endpoint, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    // 204 No Content has no body to parse.
    const data = (response.status === 204 ? null : await response.json()) as T;

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  }
}
