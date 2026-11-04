import { AppError } from '../../../core/errors/AppError';
import { GoChampsScoreboardRepository } from '../GoChampsScoreboardRepository';

describe('GoChampsScoreboardRepository', () => {
  it('reads a game from the production scoreboard without credentials', async () => {
    const data = { data: { home_team: {}, away_team: {} } };
    const request = jest.fn().mockResolvedValue({ ok: true, status: 200, data });
    await expect(new GoChampsScoreboardRepository({ request }).getScoreboardGame('game-1')).resolves.toBe(data);
    expect(request).toHaveBeenCalledWith({
      endpoint: 'https://scoreboard.go-champs.com/v1/games/game-1',
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  });

  it('fails on an error status', async () => {
    const request = jest.fn().mockResolvedValue({ ok: false, status: 404, data: null });
    await expect(new GoChampsScoreboardRepository({ request }, 'https://sb.test/v1').getScoreboardGame('x')).rejects.toBeInstanceOf(AppError);
  });
});
