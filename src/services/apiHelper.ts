// Helper function to make API requests with proper headers to bypass Cloudflare protection

export const API_BASE = 'https://api.go-champs.com/v1';

export const apiFetch = async (endpoint: string): Promise<Response> => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  
  // Headers compatíveis com React Native
  const headers: Record<string, string> = {
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7',
    'authorization': 'Bearer null',
    'content-type': 'application/json',
    'origin': 'https://go-champs.com',
    'referer': 'https://go-champs.com/',
  };

  // Headers específicos do navegador (podem não funcionar no React Native, mas tentamos)
  try {
    headers['sec-ch-ua'] = '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"';
    headers['sec-ch-ua-mobile'] = '?0';
    headers['sec-ch-ua-platform'] = '"macOS"';
    headers['sec-fetch-dest'] = 'empty';
    headers['sec-fetch-mode'] = 'cors';
    headers['sec-fetch-site'] = 'same-site';
  } catch (e) {
    // Ignora se algum header não for suportado
  }
  
  return fetch(url, {
    method: 'GET',
    headers,
  });
};
