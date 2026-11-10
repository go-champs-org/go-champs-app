import { athleteProfile } from '../../../../test/fixtures/athleteGamesFixtures';
import { PROFILE_SHARE_FORMATS, profileShareCard } from '../profileShare';

const fiveByFive = {
  sport_slug: 'basketball_5x5',
  sport_name: 'Basketball 5x5',
  tournaments_count: 3,
  stats: {
    game_played: 24,
    points: 312,
    points_per_game: 13,
    minutes_played: 40320,
    minutes_played_per_game: 1680,
    rebounds: 148,
    rebounds_per_game: 6.2,
    assists: null,
    assists_per_game: 2.5,
  },
};

const threeByThree = {
  sport_slug: 'basketball_3x3',
  sport_name: null,
  tournaments_count: 1,
  stats: { game_played: 4, points: 30, points_per_game: 7.5 },
};

describe('PROFILE_SHARE_FORMATS', () => {
  it('offers the bottom list and the centered stack, each with both logos', () => {
    expect(PROFILE_SHARE_FORMATS.map(({ id, layout, logo }) => ({ id, layout, logo }))).toEqual([
      { id: 'bottom-dark', layout: 'bottom', logo: 'dark' },
      { id: 'bottom-light', layout: 'bottom', logo: 'light' },
      { id: 'center-dark', layout: 'center', logo: 'dark' },
      { id: 'center-light', layout: 'center', logo: 'light' },
    ]);
  });

  it('labels each format for the grid and for screen readers', () => {
    expect(PROFILE_SHARE_FORMATS.map((format) => format.label)).toEqual([
      'Lista · logo escuro',
      'Lista · logo claro',
      'Destaque · logo escuro',
      'Destaque · logo claro',
    ]);
    expect(PROFILE_SHARE_FORMATS[3].description).toBe('Estatísticas em destaque no centro, logo claro');
    expect(PROFILE_SHARE_FORMATS[0].description).toBe('Estatísticas embaixo, logo escuro');
  });
});

describe('profileShareCard', () => {
  it('shares the 5x5 summary: tournaments, games, totals and per-game averages', () => {
    const card = profileShareCard(athleteProfile({ career_stats: [threeByThree, fiveByFive] }));
    expect(card).toEqual({
      name: 'Ana Silva',
      sport: 'Basquete 5x5',
      tournaments: '3',
      games: '24',
      stats: [
        { key: 'points', label: 'Pontos', perGameLabel: 'Pontos por jogo', total: '312', perGame: '13.0', totalCaption: '312 no total' },
        { key: 'minutes_played', label: 'Minutos', perGameLabel: 'Minutos por jogo', total: '672', perGame: '28:00', totalCaption: '672 no total' },
        { key: 'rebounds', label: 'Rebotes', perGameLabel: 'Rebotes por jogo', total: '148', perGame: '6.2', totalCaption: '148 no total' },
        { key: 'assists', label: 'Assistências', perGameLabel: 'Assistências por jogo', total: '—', perGame: '2.5', totalCaption: '— no total' },
      ],
    });
  });

  it('falls back to the only sport the athlete plays', () => {
    const card = profileShareCard(athleteProfile({ career_stats: [threeByThree] }));
    expect(card?.sport).toBe('Basquete 3x3');
    expect(card?.games).toBe('4');
    expect(card?.stats.map((stat) => stat.key)).toEqual(['points']);
  });

  it('uses the username when the profile has no name', () => {
    expect(profileShareCard(athleteProfile({ name: '', career_stats: [fiveByFive] }))?.name).toBe('ana');
  });

  it('has nothing to share without a profile or a career', () => {
    expect(profileShareCard(null)).toBeNull();
    expect(profileShareCard(athleteProfile({ career_stats: [] }))).toBeNull();
    expect(profileShareCard(athleteProfile({ career_stats: undefined }))).toBeNull();
  });
});
