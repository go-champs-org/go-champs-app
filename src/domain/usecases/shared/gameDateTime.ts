// The operator types a game's kickoff as a wall-clock time and the API stores
// that same wall clock as UTC, as the public site and the CMS read it. So a
// game's date and time are read in UTC: converting them to the device's zone
// would shift every game away from what was typed.

const pad = (value: number) => String(value).padStart(2, '0');

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const parse = (iso: string): Date | null => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
};

const timeOf = (date: Date) => `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;

// The calendar day a game is played on, as a sortable key ('2026-10-31').
export const gameDateKey = (iso: string): string => {
  const date = parse(iso);
  if (!date) return '';
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

// Today on the device's own calendar, to meet the games' wall-clock days.
export const localDateKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// '13:30'
export const formatGameTime = (iso: string): string => {
  const date = parse(iso);
  return date ? timeOf(date) : '';
};

// '31/10/2026, 13:30'
export const formatGameDateTime = (iso: string | null | undefined): string => {
  if (!iso) return 'Data a definir';
  const date = parse(iso);
  if (!date) return iso;
  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}, ${timeOf(date)}`;
};

// '31 de out., 13:30'
export const formatGameShortDateTime = (iso: string | null | undefined): string => {
  if (!iso) return 'Data a definir';
  const date = parse(iso);
  if (!date) return iso;
  return `${pad(date.getUTCDate())} de ${MONTHS[date.getUTCMonth()]}., ${timeOf(date)}`;
};
