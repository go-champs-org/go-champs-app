import {
  BoxScoreColumn,
  BoxScoreColumnKey,
  BoxScoreRow,
  BoxScoreTeamSection,
  GameDetail,
  PlayerStatsLog,
} from '../../models/GameDetail';

export const BOX_SCORE_COLUMNS: BoxScoreColumn[] = [
  { key: 'min', label: 'MIN' },
  { key: 'pts', label: 'PTS' },
  { key: 'reb', label: 'REB' },
  { key: 'ass', label: 'ASS' },
  { key: 'toc', label: 'TOC' },
  { key: 'rou', label: 'ROU' },
  { key: 'err', label: 'ERR' },
  { key: 'eff', label: 'EFF' },
  { key: 'plusMinus', label: '+/-' },
  { key: 'll', label: 'LL' },
  { key: 'llPct', label: 'LL%' },
  { key: 'twoPt', label: '2PT' },
  { key: 'twoPtPct', label: '2PT%' },
  { key: 'threePt', label: '3PTS' },
  { key: 'threePtPct', label: '3PT%' },
];

export const BOX_SCORE_GLOSSARY: { label: string; description: string }[] = [
  { label: 'MIN', description: 'Minutos jogados' },
  { label: 'PTS', description: 'Pontos' },
  { label: 'REB', description: 'Rebotes' },
  { label: 'ASS', description: 'Assistências' },
  { label: 'TOC', description: 'Tocos' },
  { label: 'ROU', description: 'Roubos' },
  { label: 'ERR', description: 'Erros' },
  { label: 'EFF', description: 'Eficiência' },
  { label: '+/-', description: 'Mais/menos em quadra' },
  { label: 'LL', description: 'Lances livres convertidos / tentados' },
  { label: 'LL%', description: 'Aproveitamento de lances livres' },
  { label: '2PT', description: 'Arremessos de 2 pontos convertidos / tentados' },
  { label: '2PT%', description: 'Aproveitamento de 2 pontos' },
  { label: '3PTS', description: 'Arremessos de 3 pontos convertidos / tentados' },
  { label: '3PT%', description: 'Aproveitamento de 3 pontos' },
];

const num = (stats: PlayerStatsLog['stats'], key: string): number => {
  const raw = stats[key];
  if (raw == null || raw === '') return 0;
  const parsed = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatMinutesPlayed = (secondsRaw: string | number | null | undefined): string => {
  const seconds = typeof secondsRaw === 'number' ? secondsRaw : Number(secondsRaw ?? 0);
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

const formatInt = (value: number): string => String(Math.round(value));

const formatPct = (value: number): string => {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.round(value)}%`;
};

const formatMadeAttempted = (made: number, attempted: number): string =>
  `${formatInt(made)}/${formatInt(attempted)}`;

const mapStatsToValues = (stats: PlayerStatsLog['stats']): Record<BoxScoreColumnKey, string> => {
  const ftMade = num(stats, 'free_throws_made');
  const ftAtt = num(stats, 'free_throws_attempted');
  const fgMade = num(stats, 'field_goals_made');
  const fgAtt = num(stats, 'field_goals_attempted');
  const threeMade = num(stats, 'three_point_field_goals_made');
  const threeAtt = num(stats, 'three_point_field_goals_attempted');

  return {
    min: formatMinutesPlayed(stats.minutes_played),
    pts: formatInt(num(stats, 'points')),
    reb: formatInt(num(stats, 'rebounds')),
    ass: formatInt(num(stats, 'assists')),
    toc: formatInt(num(stats, 'blocks')),
    rou: formatInt(num(stats, 'steals')),
    err: formatInt(num(stats, 'turnovers')),
    eff: formatInt(num(stats, 'efficiency')),
    plusMinus: formatInt(num(stats, 'plus_minus')),
    ll: formatMadeAttempted(ftMade, ftAtt),
    llPct: formatPct(num(stats, 'free_throw_percentage')),
    twoPt: formatMadeAttempted(fgMade, fgAtt),
    twoPtPct: formatPct(num(stats, 'field_goal_percentage')),
    threePt: formatMadeAttempted(threeMade, threeAtt),
    threePtPct: formatPct(num(stats, 'three_point_field_goal_percentage')),
  };
};

const emptyValues = (): Record<BoxScoreColumnKey, string> => ({
  min: '0:00',
  pts: '0',
  reb: '0',
  ass: '0',
  toc: '0',
  rou: '0',
  err: '0',
  eff: '0',
  plusMinus: '0',
  ll: '0/0',
  llPct: '0%',
  twoPt: '0/0',
  twoPtPct: '0%',
  threePt: '0/0',
  threePtPct: '0%',
});

export const buildBoxScore = (game: GameDetail, logs: PlayerStatsLog[]): BoxScoreTeamSection[] => {
  const logsByPlayer = new Map(logs.map((log) => [log.player_id, log]));

  const buildSection = (
    team: GameDetail['home_team'] | GameDetail['away_team']
  ): BoxScoreTeamSection | null => {
    if (!team) return null;

    const teamLogs = logs.filter((log) => log.team_id === team.id);
    const playerIds = new Set<string>([
      ...team.players.map((player) => player.id),
      ...teamLogs.map((log) => log.player_id),
    ]);

    const rows: BoxScoreRow[] = Array.from(playerIds)
      .map((playerId) => {
        const roster = team.players.find((player) => player.id === playerId);
        const log = logsByPlayer.get(playerId);
        if (!roster && !log) return null;
        if (log && num(log.stats, 'game_played') === 0 && !roster) return null;

        return {
          playerId,
          playerName: roster?.name || 'Jogador',
          shirtNumber: roster?.shirt_number ?? null,
          values: log ? mapStatsToValues(log.stats) : emptyValues(),
        };
      })
      .filter((row): row is BoxScoreRow => row != null)
      .sort((a, b) => {
        const aPts = Number(a.values.pts);
        const bPts = Number(b.values.pts);
        return bPts - aPts;
      });

    return {
      teamId: team.id,
      teamName: team.name,
      logoUrl: team.logo_url,
      rows,
    };
  };

  return [buildSection(game.home_team), buildSection(game.away_team)].filter(
    (section): section is BoxScoreTeamSection => section != null
  );
};
