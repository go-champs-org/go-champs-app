export type SportStatistic = {
  level: 'game' | 'tournament' | string;
  name: string;
  scope: string;
  slug: string;
  value_type: 'manual' | 'calculated' | string;
};

export type SportConfig = {
  name: string;
  slug: string;
  coach_types?: { type: string }[];
  player_statistics?: SportStatistic[];
};

export type SportResponse = {
  data: SportConfig;
};
