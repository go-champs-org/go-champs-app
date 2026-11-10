import {
  copa,
  liga,
  recentGame,
  teamGame,
} from '../../../../test/fixtures/athleteGamesFixtures';
import {
  athleteSides,
  countdownLabel,
  dateTile,
  DEFAULT_MY_GAMES_FILTER,
  effectiveTournamentId,
  filterMyGames,
  kickoffTime,
  longDate,
  monthHeading,
  myGamesTournaments,
  resultHeading,
  resultLabel,
  resultMatchup,
  resultTone,
  statLine,
  statusLabel,
  teamLabel,
  teamMark,
  upcomingMeta,
  venueLabel,
} from '../myGames';

// 9 Nov 2026, midday on the device's own calendar.
const now = new Date(2026, 10, 9, 12, 0, 0);

const later = teamGame({ id: 'later', datetime: '2026-11-19T19:00:00Z' });
const next = teamGame({ id: 'next', datetime: '2026-11-12T19:30:00Z' });
const inLiga = teamGame({ id: 'liga-game', datetime: '2026-11-15T18:00:00Z', tournament: liga });
const finished = teamGame({ id: 'finished', datetime: '2026-11-08T19:00:00Z', is_finished: true });
const ended = teamGame({ id: 'ended', datetime: '2026-11-09T10:00:00Z', live_state: 'ended' });
const stale = teamGame({ id: 'stale', datetime: '2026-11-08T19:00:00Z' });
const live = teamGame({ id: 'live', datetime: '2026-11-08T23:00:00Z', live_state: 'in_progress' });
const undated = teamGame({ id: 'undated', datetime: null });

const copaResult = recentGame({ id: 'copa-result' });
const ligaResult = recentGame({ id: 'liga-result', datetime: '2026-11-01T19:00:00Z', tournament: { ...liga, sport_slug: 'basketball_5x5' } });

const data = {
  teamGames: [later, inLiga, finished, ended, stale, next, undated],
  recentGames: [copaResult, ligaResult],
};

describe('filterMyGames', () => {
  it('splits the next game, the other upcoming ones and the results', () => {
    const sections = filterMyGames(data, DEFAULT_MY_GAMES_FILTER, now);
    expect(sections.next?.id).toBe('next');
    expect(sections.upcoming.map((game) => game.id)).toEqual(['liga-game', 'later']);
    expect(sections.previous.map((recent) => recent.game.id)).toEqual(['copa-result', 'liga-result']);
  });

  it('leaves out finished, ended, undated and unclosed past games', () => {
    const ids = filterMyGames(data, DEFAULT_MY_GAMES_FILTER, now).upcoming.map((game) => game.id);
    expect(ids).not.toContain('finished');
    expect(ids).not.toContain('ended');
    expect(ids).not.toContain('stale');
    expect(ids).not.toContain('undated');
  });

  it('keeps a live game from an earlier day as the next one', () => {
    const sections = filterMyGames({ teamGames: [next, live], recentGames: [] }, DEFAULT_MY_GAMES_FILTER, now);
    expect(sections.next?.id).toBe('live');
    expect(sections.upcoming.map((game) => game.id)).toEqual(['next']);
  });

  it('counts a game later today as upcoming', () => {
    const today = teamGame({ id: 'today', datetime: '2026-11-09T21:00:00Z' });
    expect(filterMyGames({ teamGames: [today], recentGames: [] }, DEFAULT_MY_GAMES_FILTER, now).next?.id).toBe('today');
  });

  it('shows only upcoming games in the upcoming view', () => {
    const sections = filterMyGames(data, { view: 'upcoming', tournamentId: null }, now);
    expect(sections.next?.id).toBe('next');
    expect(sections.upcoming).toHaveLength(2);
    expect(sections.previous).toEqual([]);
  });

  it('narrows every section to the selected tournament', () => {
    const sections = filterMyGames(data, { view: 'all', tournamentId: liga.id }, now);
    expect(sections.next?.id).toBe('liga-game');
    expect(sections.upcoming).toEqual([]);
    expect(sections.previous.map((recent) => recent.game.id)).toEqual(['liga-result']);
  });

  it('combines the upcoming view with a tournament', () => {
    const sections = filterMyGames(data, { view: 'upcoming', tournamentId: copa.id }, now);
    expect(sections.next?.id).toBe('next');
    expect(sections.upcoming.map((game) => game.id)).toEqual(['later']);
    expect(sections.previous).toEqual([]);
  });

  it('reads a tournament no longer among the games as all of them', () => {
    const sections = filterMyGames(data, { view: 'all', tournamentId: 'gone' }, now);
    expect(sections.next?.id).toBe('next');
    expect(sections.previous).toHaveLength(2);
  });

  it('has nothing to show without games', () => {
    expect(filterMyGames({ teamGames: [], recentGames: [] }, DEFAULT_MY_GAMES_FILTER, now)).toEqual({
      next: null,
      upcoming: [],
      previous: [],
    });
  });

  it('does not change the loaded games', () => {
    const teamGames = [later, next];
    filterMyGames({ teamGames, recentGames: [] }, DEFAULT_MY_GAMES_FILTER, now);
    expect(teamGames.map((game) => game.id)).toEqual(['later', 'next']);
  });
});

describe('myGamesTournaments', () => {
  it('lists each tournament once, upcoming games first by kickoff, then results', () => {
    const results = recentGame({ id: 'other', tournament: { id: 'taca', name: 'Taça', slug: 'taca' } });
    expect(
      myGamesTournaments({ teamGames: [later, inLiga, undated], recentGames: [copaResult, results, recentGame({ tournament: null })] })
    ).toEqual([
      { id: 'copa', name: 'Copa Central' },
      { id: 'liga', name: 'Liga Norte' },
      { id: 'taca', name: 'Taça' },
    ]);
  });

  it('skips games without a tournament', () => {
    expect(myGamesTournaments({ teamGames: [teamGame({ tournament: null })], recentGames: [] })).toEqual([]);
  });
});

describe('effectiveTournamentId', () => {
  it('keeps a tournament among the games and drops one that is not', () => {
    expect(effectiveTournamentId(data, liga.id)).toBe('liga');
    expect(effectiveTournamentId(data, 'gone')).toBeNull();
    expect(effectiveTournamentId(data, null)).toBeNull();
  });
});

describe('game presentation', () => {
  it('names a team, its placeholder or a pending one', () => {
    expect(teamLabel({ id: 't', name: 'Alpha' }, 'Vencedor A')).toBe('Alpha');
    expect(teamLabel(null, 'Vencedor A')).toBe('Vencedor A');
    expect(teamLabel(null)).toBe('A definir');
  });

  it("reads the game from the athlete's side", () => {
    expect(athleteSides(next, 'team-a')).toMatchObject({ isHome: true, team: 'Alpha', opponent: 'Beta' });
    expect(athleteSides(next, 'team-b')).toMatchObject({ isHome: false, team: 'Beta', opponent: 'Alpha' });
    expect(athleteSides(next, 'team-b').opponentMark).toEqual({ name: 'Alpha', code: 'ALP', logoUrl: 'https://cdn/alpha.png' });
  });

  it('shows a team by its logo and tri code, the name standing in', () => {
    expect(teamMark({ id: 't', name: 'Alpha', tri_code: 'ALP', logo_url: 'https://cdn/a.png' })).toEqual({
      name: 'Alpha',
      code: 'ALP',
      logoUrl: 'https://cdn/a.png',
    });
    expect(teamMark({ id: 't', name: 'Alpha' })).toEqual({ name: 'Alpha', code: 'Alpha', logoUrl: null });
    expect(teamMark(null, 'Vencedor A')).toEqual({ name: 'Vencedor A', code: 'Vencedor A', logoUrl: null });
  });

  it('formats the kickoff in the wall clock the API stores', () => {
    expect(dateTile(next.datetime)).toEqual({ day: '12', month: 'NOV' });
    expect(dateTile(null)).toEqual({ day: '--', month: '' });
    expect(longDate(next.datetime)).toBe('Quinta-feira, 12 de novembro');
    expect(longDate('not a date')).toBe('Data a definir');
    expect(kickoffTime(next.datetime)).toBe('19:30');
    expect(kickoffTime(null)).toBe('--:--');
    expect(monthHeading(later.datetime)).toBe('NOV 2026');
    expect(monthHeading(null)).toBe('');
  });

  it('counts the days to the next game', () => {
    expect(countdownLabel(live, now)).toBe('AO VIVO');
    expect(countdownLabel(teamGame({ datetime: '2026-11-09T21:00:00Z' }), now)).toBe('HOJE');
    expect(countdownLabel(teamGame({ datetime: '2026-11-10T21:00:00Z' }), now)).toBe('AMANHÃ');
    expect(countdownLabel(next, now)).toBe('EM 3 DIAS');
    expect(countdownLabel(undated, now)).toBe('');
  });

  it('labels the status and the venue', () => {
    expect(statusLabel(next)).toBe('Agendado');
    expect(statusLabel(live)).toBe('Ao vivo');
    expect(venueLabel(next)).toBe('São Paulo · Ginásio Central');
    expect(venueLabel(teamGame({ location: null }))).toBe('São Paulo');
    expect(venueLabel(teamGame({ city: null }))).toBe('Ginásio Central');
    expect(venueLabel(teamGame({ city: 'Canoas', location: ' canoas ' }))).toBe('Canoas');
    expect(venueLabel(teamGame({ location: null, city: null }))).toBe('Local a definir');
    expect(upcomingMeta(teamGame({ datetime: '2026-11-15T18:00:00Z' }))).toBe('Dom · 18:00 · São Paulo · Ginásio Central');
    expect(upcomingMeta(teamGame({ datetime: '2026-11-15T18:00:00Z', location: null, city: null }))).toBe('Dom · 18:00');
    expect(upcomingMeta(undated)).toBe('São Paulo · Ginásio Central');
  });
});

describe('result presentation', () => {
  it('heads the result with its date and tournament', () => {
    expect(resultHeading(copaResult)).toBe('7 NOV · COPA CENTRAL');
    expect(resultHeading(recentGame({ tournament: null }))).toBe('7 NOV');
  });

  it('labels a win, a loss, a tie or nothing', () => {
    expect(resultLabel(copaResult)).toBe('VITÓRIA');
    expect(resultLabel(recentGame({}, { result: 'loss' }))).toBe('DERROTA');
    expect(resultLabel(recentGame({ home_score: 70, away_score: 70 }, { result: null }))).toBe('EMPATE');
    expect(resultLabel(recentGame({ home_score: null, away_score: null }, { result: null }))).toBeNull();
  });

  it('tones the badge by the result', () => {
    expect(resultTone(copaResult)).toBe('win');
    expect(resultTone(recentGame({}, { result: 'loss' }))).toBe('loss');
    expect(resultTone(recentGame({ home_score: 70, away_score: 70 }, { result: null }))).toBe('tie');
    expect(resultTone(recentGame({ home_score: null, away_score: null }, { result: null }))).toBeNull();
  });

  it("puts the athlete's side first", () => {
    expect(resultMatchup(copaResult)).toMatchObject({ title: 'Alpha vs Beta', score: '84–76' });
    expect(resultMatchup(copaResult).opponent.code).toBe('BET');
    expect(resultMatchup(recentGame({}, { athlete_team_id: 'team-b' }))).toMatchObject({ title: 'Beta vs Alpha', score: '76–84' });
    expect(resultMatchup(recentGame({}, { athlete_team_id: 'team-b' })).team.code).toBe('BET');
    expect(resultMatchup(recentGame({ home_score: null })).score).toBe('–');
  });

  it('reads the stat line with only what the game recorded', () => {
    expect(statLine(copaResult.stats)).toBe('28 PTS  ·  8 REB  ·  6 AST  ·  32 MIN');
    expect(statLine({ points: 12, rebounds: null, assists: '' })).toBe('12 PTS');
    expect(statLine({})).toBe('');
  });
});
