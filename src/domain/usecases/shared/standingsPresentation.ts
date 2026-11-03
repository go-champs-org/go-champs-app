import { EliminationStat } from '../../../models/EliminationModel';

export type StandingsColumn = {
  id: string;
  label: string;
  title: string;
  emphasized: boolean;
};

const MAX_PLAIN_LABEL = 4;
const CONNECTORS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

// A phase's ranking criteria include internal tie-breakers alongside the
// columns organizers publish; only the "overall" ones are meant to be seen.
// Older payloads carry no criteria at all, and then every column shows.
export const visibleStats = (stats: EliminationStat[]): EliminationStat[] =>
  stats.filter((stat) => !stat.ranking_criteria || stat.ranking_criteria === 'overall');

const abbreviate = (title: string): string => {
  const trimmed = title.trim();
  if (trimmed.length <= MAX_PLAIN_LABEL) return trimmed.toUpperCase();

  return trimmed
    .split(/\s+/)
    .filter((word) => !CONNECTORS.has(word.toLowerCase()))
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
};

// The stacked standings rows have room for a short label per stat. A title
// that is already short stays as typed; a longer one becomes its initials,
// and two stats that would share initials keep three letters of their title.
export const standingsColumns = (stats: EliminationStat[]): StandingsColumn[] => {
  const visible = visibleStats(stats);
  const labels = visible.map((stat) => abbreviate(stat.title));
  const counts = labels.reduce<Record<string, number>>((acc, label) => ({ ...acc, [label]: (acc[label] || 0) + 1 }), {});

  return visible.map((stat, index) => ({
    id: stat.id,
    title: stat.title.trim(),
    label: counts[labels[index]] > 1 ? stat.title.trim().slice(0, 3).toUpperCase() : labels[index],
    emphasized: stat.ranking_order > 0,
  }));
};

// Spelled out only for the labels that shortened their title.
export const standingsLegend = (columns: StandingsColumn[]): string =>
  columns
    .filter((column) => column.label !== column.title.toUpperCase())
    .map((column) => `${column.label} ${column.title}`)
    .join(' · ');
