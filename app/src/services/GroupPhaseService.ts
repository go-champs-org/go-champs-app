import { GroupPhaseResponse, GroupPhaseData } from '../models/GroupPhaseModel';
import { fetchGamesByPhaseId } from './PlayoffService';
import { apiFetch } from './apiHelper';

// Fetch group phase data for a given phase
export const fetchGroupPhaseData = async (phaseId: string): Promise<GroupPhaseData> => {
  try {
    const response = await apiFetch(`/phases/${phaseId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const jsonData: GroupPhaseResponse = await response.json();
    return jsonData.data;
  } catch (error) {
    console.warn('Error fetching group phase data:', error);
    throw error;
  }
};

// Reuse games fetch from PlayoffService
export { fetchGamesByPhaseId };

