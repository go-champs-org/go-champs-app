// Modelo compartilhado para dados de eliminação/classificação

export interface EliminationStat {
  id: string;
  title: string;
  team_stat_source: string;
  ranking_order: number;
}

export interface TeamStat {
  id: string;
  team_id: string;
  placeholder: string | null;
  stats: Record<string, string | number>;
}

export interface Elimination {
  id: string;
  title: string | null;
  order: number;
  info: string | null;
  team_stats: TeamStat[];
}

