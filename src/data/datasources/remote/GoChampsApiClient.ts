import { API_CONFIG } from '../../../core/config/apiConfig';
import { AppError } from '../../../core/errors/AppError';
import { HttpClient, HttpHeaders } from '../../../core/http/HttpClient';

const defaultHeaders: HttpHeaders = {
  accept: '*/*',
  'accept-language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7',
  authorization: 'Bearer null',
  'content-type': 'application/json',
  origin: 'https://go-champs.com',
  referer: 'https://go-champs.com/',
};

export class GoChampsApiClient {
  constructor(private readonly httpClient: HttpClient) {}

  async get<T>(endpoint: string, baseUrl = API_CONFIG.goChampsBaseUrl): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
    const response = await this.httpClient.request<T>({
      endpoint: url,
      headers: defaultHeaders,
    });

    if (!response.ok) {
      throw new AppError(`HTTP error! status: ${response.status}`, response.status);
    }

    return response.data;
  }
}

