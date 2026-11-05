import {
  formatGameDateTime,
  formatGameShortDateTime,
  formatGameTime,
  gameDateKey,
  localDateKey,
} from '../gameDateTime';

// Stored as the wall clock the operator typed, so 13:30Z reads 13:30 in any zone.
const KICKOFF = '2026-10-31T13:30:00Z';
// Late at night, where a device west of UTC would roll back a day.
const LATE = '2026-11-01T01:15:00Z';

describe('gameDateTime', () => {
  it('reads the day and time as stored, in UTC', () => {
    expect(gameDateKey(KICKOFF)).toBe('2026-10-31');
    expect(gameDateKey(LATE)).toBe('2026-11-01');
    expect(formatGameTime(KICKOFF)).toBe('13:30');
    expect(formatGameTime(LATE)).toBe('01:15');
    expect(formatGameDateTime(KICKOFF)).toBe('31/10/2026, 13:30');
    expect(formatGameShortDateTime(LATE)).toBe('01 de nov., 01:15');
  });

  it('keeps a missing or broken datetime readable', () => {
    expect(gameDateKey('nope')).toBe('');
    expect(formatGameTime('nope')).toBe('');
    expect(formatGameDateTime(null)).toBe('Data a definir');
    expect(formatGameDateTime('nope')).toBe('nope');
    expect(formatGameShortDateTime(undefined)).toBe('Data a definir');
    expect(formatGameShortDateTime('nope')).toBe('nope');
  });

  it('keys today on the device calendar', () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});
