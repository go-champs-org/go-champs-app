import { ClassificationResponse, ClassificationData } from '../models/ClassificationModel';
import { fetchGamesByPhaseId } from './PlayoffService';
import { apiFetch } from './apiHelper';

// Fetch classification data for a given phase
export const fetchClassificationData = async (phaseId: string): Promise<ClassificationData> => {
  try {
    const response = await apiFetch(`/phases/${phaseId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const jsonData: ClassificationResponse = await response.json();
    return jsonData.data;
  } catch (error) {
    console.warn('Error fetching classification data:', error);
    throw error;
  }
};

// Reuse games fetch from PlayoffService
export { fetchGamesByPhaseId };

