import { Organization } from '../models/Organization';

const API_URL = 'https://go-champs-api-staging.herokuapp.com/api/organizations';

export const getOrganizations = async (): Promise<Organization[]> => {
  try {
    const response = await fetch(API_URL);
    const jsonData = await response.json();
    return jsonData.data;
  } catch (error) {
    console.error('Erro ao buscar organizações:', error);
    return [];
  }
};
