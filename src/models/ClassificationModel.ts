import { EliminationStat, Elimination } from './EliminationModel';

export type { Elimination };

export interface ClassificationData {
  id: string;
  title: string;
  type: string;
  is_in_progress: boolean;
  order: number;
  elimination_stats: EliminationStat[];
  eliminations: Elimination[];
  draws?: any[]; // Para compatibilidade com estrutura de phase
}

export interface ClassificationResponse {
  data: ClassificationData;
}

