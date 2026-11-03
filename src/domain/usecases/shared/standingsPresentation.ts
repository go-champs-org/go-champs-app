import { EliminationStat } from '../../../models/EliminationModel';

export type StandingsColumn = {
  id: string;
  title: string;
};

// A phase's ranking criteria include internal tie-breakers alongside the
// columns organizers publish; only the "overall" ones are meant to be seen.
// Older payloads carry no criteria at all, and then every column shows.
export const visibleStats = (stats: EliminationStat[]): EliminationStat[] =>
  stats.filter((stat) => !stat.ranking_criteria || stat.ranking_criteria === 'overall');

// Columns read as the organizer titled them, like the public standings table.
export const standingsColumns = (stats: EliminationStat[]): StandingsColumn[] =>
  visibleStats(stats).map((stat) => ({ id: stat.id, title: stat.title.trim() }));
