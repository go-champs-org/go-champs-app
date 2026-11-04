import { Elimination, EliminationStat } from './EliminationModel';
import { Draw } from './PlayoffModel';

// A phase as /phases/:id returns it: standings carry eliminations, a bracket
// carries draws, and either list is empty for the other kind.
export interface PhaseData {
  id: string;
  title: string;
  type: string;
  is_in_progress: boolean;
  order: number;
  elimination_stats: EliminationStat[];
  eliminations: Elimination[];
  draws: Draw[];
}

export interface PhaseResponse {
  data: PhaseData;
}
