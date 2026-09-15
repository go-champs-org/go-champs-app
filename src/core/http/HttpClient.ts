export type HttpHeaders = Record<string, string>;

export type HttpRequest = {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  headers?: HttpHeaders;
  body?: unknown;
};

export type HttpResponse<T = unknown> = {
  ok: boolean;
  status: number;
  data: T;
};

export interface HttpClient {
  request<T = unknown>(request: HttpRequest): Promise<HttpResponse<T>>;
}
