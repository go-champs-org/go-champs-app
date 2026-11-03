import { GetLiveScoreUseCase } from '../GetLiveScoreUseCase';

describe('GetLiveScoreUseCase', () => {
  it('reads the scoreboard game and returns its running score', async () => {
    const getScoreboardGame = jest.fn().mockResolvedValue({
      data: { home_team: { total_player_stats: { points: 5 } }, away_team: { total_player_stats: { points: 11 } }, live_state: { state: 'in_progress' } },
    });
    await expect(new GetLiveScoreUseCase({ getScoreboardGame }).execute('game-1')).resolves.toEqual({
      score: { homeScore: 5, awayScore: 11 },
      ended: false,
    });
    expect(getScoreboardGame).toHaveBeenCalledWith('game-1');
  });
});
