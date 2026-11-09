import { membership, recentGame } from '../../../../test/fixtures/athleteGamesFixtures';
import { careerSummaries, scoringForm, sportLabel, tournamentCards } from '../athleteHome';

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

describe('scoringForm', () => {
  const games = [28, 21, 16, 24, 18, 40].map((points, index) =>
    recentGame({ id: `g${index}`, datetime: `2026-11-0${7 - index}T19:00:00Z` }, { stats: { points } })
  );

  it('shows the last five games oldest first, sized against the best', () => {
    const bars = scoringForm(games, 'basketball_5x5');
    expect(bars.map((bar) => bar.gameId)).toEqual(['g4', 'g3', 'g2', 'g1', 'g0']);
    expect(bars.map((bar) => bar.label)).toEqual(['18', '24', '16', '21', '28']);
    expect(bars.map((bar) => bar.date)).toEqual(['3 nov', '4 nov', '5 nov', '6 nov', '7 nov']);
    expect(bars[4]).toMatchObject({ ratio: 1, latest: true });
    expect(bars[0]).toMatchObject({ ratio: 18 / 28, latest: false });
  });

  it("keeps only the sport's games", () => {
    const threeByThree = recentGame(
      { id: '3x3', tournament: { id: 't3', name: '3x3', slug: '3x3', sport_slug: 'basketball_3x3' } },
      { stats: { points: 9 } }
    );
    expect(scoringForm([threeByThree, ...games.slice(0, 1)], 'basketball_3x3').map((bar) => bar.gameId)).toEqual(['3x3']);
  });

  it('reads a game without points as zero', () => {
    const [bar] = scoringForm([recentGame({ datetime: 'bad', tournament: null }, { stats: { points: null } })], 'basketball_5x5');
    expect(bar).toMatchObject({ points: 0, label: '0', ratio: 0, date: '', latest: true });
  });
});

describe('tournamentCards', () => {
  it('describes each membership', () => {
    expect(tournamentCards([membership()])).toEqual([
      {
        key: 'copa:team-a',
        tournamentId: 'copa',
        name: 'Copa Central',
        organization: 'Federação Paulista',
        sport: 'Basquete 5x5',
        team: 'Alpha · #7',
      },
    ]);
  });

  it('works without an organization or shirt number', () => {
    const [card] = tournamentCards([
      membership({ shirt_number: null, tournament: { ...membership().tournament, organization: null } }),
    ]);
    expect(card.organization).toBeNull();
    expect(card.team).toBe('Alpha');
    expect(tournamentCards(undefined)).toEqual([]);
  });
});
