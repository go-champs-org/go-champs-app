import { membership, recentGame } from '../../../../test/fixtures/athleteGamesFixtures';
import { careerSummaries, monthlyScoring, sportLabel, tournamentCards } from '../athleteHome';

const fiveByFive = {
  sport_slug: 'basketball_5x5',
  sport_name: 'Basketball 5x5',
  tournaments_count: 2,
  stats: {
    game_played: 12,
    points: 257,
    points_per_game: 21.4,
    minutes_played: 20592,
    minutes_played_per_game: 1716,
    rebounds: 82,
    rebounds_per_game: 6.8,
    assists: null,
    assists_per_game: 4.2,
  },
};

describe('sportLabel', () => {
  it('names the sports in Portuguese and falls back to the API name or slug', () => {
    expect(sportLabel('basketball_5x5', 'Basketball 5x5')).toBe('Basquete 5x5');
    expect(sportLabel('basketball_3x3')).toBe('Basquete 3x3');
    expect(sportLabel('volleyball', 'Vôlei')).toBe('Vôlei');
    expect(sportLabel('volleyball')).toBe('volleyball');
    expect(sportLabel(null)).toBe('Esporte');
  });
});

describe('careerSummaries', () => {
  it('reads totals and per-game averages like the stats screen', () => {
    expect(careerSummaries([fiveByFive])).toEqual([
      {
        sportSlug: 'basketball_5x5',
        title: 'Basquete 5x5',
        tournaments: '2',
        games: '12',
        rows: [
          { key: 'points', label: 'Pontos', total: '257', perGame: '21.4' },
          { key: 'minutes_played', label: 'Minutos', total: '343', perGame: '28:36' },
          { key: 'rebounds', label: 'Rebotes', total: '82', perGame: '6.8' },
          { key: 'assists', label: 'Assistências', total: '—', perGame: '4.2' },
        ],
      },
    ]);
  });

  it('leaves out the stats a sport does not keep', () => {
    const [summary] = careerSummaries([
      { sport_slug: 'basketball_3x3', sport_name: null, tournaments_count: 1, stats: { points: 30, points_per_game: 10 } },
    ]);
    expect(summary.rows.map((row) => row.key)).toEqual(['points']);
    expect(summary.games).toBe('—');
  });

  it('has no summary without a career', () => {
    expect(careerSummaries(undefined)).toEqual([]);
    expect(careerSummaries([])).toEqual([]);
  });
});

describe('monthlyScoring', () => {
  const game = (id: string, datetime: string, points: number | null, sportSlug = 'basketball_5x5') =>
    recentGame(
      { id, datetime, tournament: { id: 't', name: 'Copa', slug: 'copa', sport_slug: sportSlug } },
      { stats: { points } }
    );

  it('sums the points of each month, oldest first, sized against the best month', () => {
    const bars = monthlyScoring(
      [game('a', '2026-11-07T19:00:00Z', 28), game('b', '2026-11-01T19:00:00Z', 21), game('c', '2026-10-25T19:00:00Z', 14)],
      'basketball_5x5'
    );
    expect(bars).toEqual([
      { key: '2026-10', points: 14, label: '14', month: 'out', monthLong: 'outubro de 2026', ratio: 14 / 49, latest: false },
      { key: '2026-11', points: 49, label: '49', month: 'nov', monthLong: 'novembro de 2026', ratio: 1, latest: true },
    ]);
  });

  it('reads the month in UTC, like the game dates', () => {
    expect(monthlyScoring([game('a', '2026-12-01T01:00:00Z', 10)], 'basketball_5x5')[0].key).toBe('2026-12');
  });

  it('keeps the last five months with games, across years', () => {
    const games = ['2025-11', '2025-12', '2026-01', '2026-03', '2026-04', '2026-06'].map((month, index) =>
      game(`g${index}`, `${month}-10T19:00:00Z`, 10 + index)
    );
    const bars = monthlyScoring(games, 'basketball_5x5');
    expect(bars.map((bar) => bar.key)).toEqual(['2025-12', '2026-01', '2026-03', '2026-04', '2026-06']);
    expect(bars[1]).toMatchObject({ month: 'jan', monthLong: 'janeiro de 2026' });
  });

  it("keeps only the sport's games", () => {
    const bars = monthlyScoring(
      [game('3x3', '2026-11-07T19:00:00Z', 9, 'basketball_3x3'), game('5x5', '2026-11-07T19:00:00Z', 30)],
      'basketball_3x3'
    );
    expect(bars.map((bar) => bar.points)).toEqual([9]);
  });

  it('counts a game without points as zero and skips one without a date', () => {
    const bars = monthlyScoring(
      [recentGame({ datetime: '2026-11-07T19:00:00Z', tournament: null }, { stats: { points: null } }), game('x', 'bad', 30)],
      'basketball_5x5'
    );
    expect(bars).toEqual([
      { key: '2026-11', points: 0, label: '0', month: 'nov', monthLong: 'novembro de 2026', ratio: 0, latest: true },
    ]);
  });

  it('has no bars without games', () => {
    expect(monthlyScoring([], 'basketball_5x5')).toEqual([]);
  });
});

describe('tournamentCards', () => {
  it('describes each membership', () => {
    const withLogos = membership({
      tournament: { ...membership().tournament, logo_url: 'https://cdn/copa.png' },
      team: { ...membership().team, logo_url: 'https://cdn/alpha.png' },
    });
    expect(tournamentCards([withLogos])).toEqual([
      {
        key: 'copa:team-a',
        tournamentId: 'copa',
        name: 'Copa Central',
        logoUrl: 'https://cdn/copa.png',
        organization: 'Federação Paulista',
        sport: 'Basquete 5x5',
        teamName: 'Alpha',
        teamLogoUrl: 'https://cdn/alpha.png',
        team: 'Alpha · #7',
      },
    ]);
  });

  it('works without an organization or shirt number', () => {
    const [card] = tournamentCards([
      membership({ shirt_number: null, tournament: { ...membership().tournament, organization: null } }),
    ]);
    expect(card.organization).toBeNull();
    expect(card.logoUrl).toBeNull();
    expect(card.teamLogoUrl).toBeNull();
    expect(card.team).toBe('Alpha');
    expect(tournamentCards(undefined)).toEqual([]);
  });
});
