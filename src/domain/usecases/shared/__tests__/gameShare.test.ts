import { athleteProfile, membership, recentGame } from '../../../../test/fixtures/athleteGamesFixtures';
import { GAME_SHARE_FORMATS, gameShareCard } from '../gameShare';

describe('GAME_SHARE_FORMATS', () => {
  it('offers the bottom left and the bottom right corner, each with both logos', () => {
    expect(GAME_SHARE_FORMATS.map(({ id, label }) => ({ id, label }))).toEqual([
      { id: 'bottom-left-dark', label: 'Esquerda · logo escuro' },
      { id: 'bottom-left-light', label: 'Esquerda · logo claro' },
      { id: 'bottom-right-dark', label: 'Direita · logo escuro' },
      { id: 'bottom-right-light', label: 'Direita · logo claro' },
    ]);
    expect(GAME_SHARE_FORMATS[2].description).toBe('Conteúdo no canto inferior direito, logo escuro');
  });
});

describe('gameShareCard', () => {
  it('puts the athlete, their team, the tournament and the game stats on the sticker', () => {
    const profile = athleteProfile({
      memberships: [membership({ tournament: { ...membership().tournament, logo_url: 'https://cdn/copa.png' } })],
    });
    expect(gameShareCard(recentGame(), profile)).toEqual({
      gameId: 'r1',
      athleteName: 'Ana Silva',
      shirtNumber: '#7',
      team: { name: 'Alpha', logoUrl: 'https://cdn/alpha.png' },
      tournament: { name: 'Copa Central', logoUrl: 'https://cdn/copa.png' },
      date: '7 nov 2026',
      stats: [
        { key: 'points', label: 'PTS', value: '28' },
        { key: 'rebounds', label: 'REB', value: '8' },
        { key: 'assists', label: 'AST', value: '6' },
        { key: 'minutes_played', label: 'MIN', value: '32' },
      ],
    });
  });

  it('uses the away team when the athlete plays away, and its missing logo', () => {
    const card = gameShareCard(recentGame({}, { athlete_team_id: 'team-b' }), athleteProfile());
    expect(card.team).toEqual({ name: 'Beta', logoUrl: null });
    // No roster spot on that team: the tournament's one still gives the number.
    expect(card.shirtNumber).toBe('#7');
    expect(card.tournament).toEqual({ name: 'Copa Central', logoUrl: null });
  });

  it('prefers the roster spot on the team the athlete played for', () => {
    const profile = athleteProfile({
      memberships: [
        membership({ shirt_number: '10' }),
        membership({ team: { id: 'team-b', name: 'Beta', logo_url: null, tri_code: 'BET' }, shirt_number: '23' }),
      ],
    });
    expect(gameShareCard(recentGame({}, { athlete_team_id: 'team-b' }), profile).shirtNumber).toBe('#23');
  });

  it('leaves out what the game or the profile does not have', () => {
    const recent = recentGame(
      { tournament: null, datetime: 'not a date', home_team: undefined as never },
      { stats: { points: 12, rebounds: null, assists: '' } }
    );
    expect(gameShareCard(recent, athleteProfile({ name: '', memberships: [membership({ shirt_number: null })] }))).toEqual({
      gameId: 'r1',
      athleteName: 'ana',
      shirtNumber: null,
      team: null,
      tournament: null,
      date: '',
      stats: [{ key: 'points', label: 'PTS', value: '12' }],
    });
  });

  it('still draws a sticker without a profile', () => {
    expect(gameShareCard(recentGame(), null)).toMatchObject({ athleteName: '', shirtNumber: null });
  });
});
