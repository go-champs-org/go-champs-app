import { EliminationStat, Elimination } from './EliminationModel';

export interface GroupPhaseData {
  id: string;
  title: string;
  type: string;
  is_in_progress: boolean;
  order: number;
  elimination_stats: EliminationStat[];
  eliminations: Elimination[]; // Cada elimination é um grupo (A, B, C...)
  draws?: any[]; // Para compatibilidade com estrutura de phase
}

export interface GroupPhaseResponse {
  data: GroupPhaseData;
}

