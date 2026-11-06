import { athleteSocialLinks, athleteStatColumns, gamesPlayedText } from '../athleteProfile';

const stat = (slug: string, title = slug) => ({ id: slug, slug, title, is_default_order: null });

describe('athleteStatColumns', () => {
  const stats = [stat('game_played'), stat('points', 'Points'), stat('points_per_game'), stat('fouls_personal'), stat('custom')];

  it('reads the tournament stats screen columns without the games played', () => {
    expect(athleteStatColumns('basketball_5x5', stats, 'aggregate')).toEqual([
      { key: 'points', label: 'PTS', description: 'Pontos' },
      { key: 'fouls_personal', label: 'FLP', description: 'Faltas pessoais' },
    ]);
    expect(athleteStatColumns('basketball_5x5', stats, 'per_game').map((column) => column.key)).toEqual(['points_per_game']);
  });

  it('keeps every public stat for a sport with no table', () => {
    expect(athleteStatColumns('volleyball', [stat('aces', 'Aces'), stat('game_played')], 'aggregate')).toEqual([
      { key: 'aces', label: 'Aces', description: 'Aces' },
    ]);
  });
});

describe('gamesPlayedText', () => {
  it('counts the games in pt-BR', () => {
    expect(gamesPlayedText(0)).toBe('');
    expect(gamesPlayedText(1)).toBe('1 jogo disputado');
    expect(gamesPlayedText(7)).toBe('7 jogos disputados');
  });
});

describe('athleteSocialLinks', () => {
  it('links every network with a handle, without the @', () => {
    expect(athleteSocialLinks({ instagram: ' @ana ', twitter: '', facebook: 'ana.fb' })).toEqual([
      { network: 'instagram', url: 'https://instagram.com/ana' },
      { network: 'facebook', url: 'https://facebook.com/ana.fb' },
    ]);
    expect(athleteSocialLinks({ instagram: null })).toEqual([]);
  });
});
