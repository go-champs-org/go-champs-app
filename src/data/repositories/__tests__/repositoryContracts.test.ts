import { GoChampsTournamentRepository } from '../GoChampsTournamentRepository';
import { GoChampsApiClient } from '../../datasources/remote/GoChampsApiClient';
import { TournamentFallbackDataSource } from '../../datasources/local/TournamentFallbackDataSource';
import { API_CONFIG } from '../../../core/config/apiConfig';
import { gamesFixture, playoffResponseFixture, tournamentDetailsFixture, classificationDataFixture } from '../../../test/fixtures/tournamentFixtures';

const baseUrl = 'https://api.example.test/v1';

describe('Tournament repository contracts', () => {
  const get = jest.fn();
  const fallback = new TournamentFallbackDataSource();
  const repository = new GoChampsTournamentRepository({ get } as unknown as GoChampsApiClient, fallback);

  beforeEach(() => get.mockReset());

  it.each([
    ['getTournamentDetails', '/tournaments/item', { data: tournamentDetailsFixture }, tournamentDetailsFixture],
    ['getPlayoffData', '/phases/item', playoffResponseFixture, playoffResponseFixture],
    ['getGamesByPhaseId', '/games?where[phase_id]=item', { data: gamesFixture }, gamesFixture],
    ['getSportConfig', '/sports/item', { data: { slug: 'basketball' } }, { slug: 'basketball' }],
    ['getClassificationData', '/phases/item', { data: classificationDataFixture }, classificationDataFixture],
    ['getGroupPhaseData', '/phases/item', { data: classificationDataFixture }, classificationDataFixture],
  ] as const)('preserves the API origin for %s', async (method, endpoint, payload, result) => {
    get.mockResolvedValue(payload);
    await expect(repository[method]('item', baseUrl)).resolves.toEqual(result);
    expect(get).toHaveBeenCalledWith(endpoint, baseUrl);
  });

  it('loads a single game by id', async () => {
    const detail = { ...gamesFixture[0], city: null, court: null, number: null, result_type: null, assets: [], officials: [], web_url: null };
    get.mockResolvedValue({ data: detail });
    await expect(repository.getGameById(detail.id, baseUrl)).resolves.toMatchObject({ id: detail.id, assets: [] });
    expect(get).toHaveBeenCalledWith(`/games/${detail.id}`, baseUrl);
  });

  it('normalizes missing assets and players on game detail', async () => {
    get.mockResolvedValue({
      data: {
        ...gamesFixture[0],
        home_team: { id: 'a', name: 'A', logo_url: null, tri_code: null },
        away_team: null,
      },
    });
    const result = await repository.getGameById('game-2', baseUrl);
    expect(result.assets).toEqual([]);
    expect(result.officials).toEqual([]);
    expect(result.home_team?.players).toEqual([]);
    expect(result.away_team).toBeNull();
  });

  it('returns empty stats logs when payload data is missing', async () => {
    get.mockResolvedValue({});
    await expect(repository.getPlayerStatsLogsByGameId('game-1', baseUrl)).resolves.toEqual([]);
  });

  it('loads player stats logs by game id', async () => {
    get.mockResolvedValue({ data: [{ id: 'log-1', player_id: 'p1', team_id: 't1', game_id: 'game-1', phase_id: null, tournament_id: null, stats: {} }] });
    await expect(repository.getPlayerStatsLogsByGameId('game-1', baseUrl)).resolves.toHaveLength(1);
    expect(get).toHaveBeenCalledWith('/player-stats-logs?where[game_id]=game-1', baseUrl);
  });

  it.each([
    ['getTournamentDetails', 'getTournamentDetails'],
    ['getPlayoffData', 'getPlayoffData'],
    ['getGamesByPhaseId', 'getGames'],
    ['getSportConfig', 'getSportConfig'],
  ] as const)('loads bundled data when %s fails', async (method, fallbackMethod) => {
    get.mockRejectedValue(new Error('offline'));
    const result = await repository[method]('item');
    expect(result).toEqual(fallback[fallbackMethod]());
    expect(result).toBeDefined();
  });

  it.each(['getClassificationData', 'getGroupPhaseData', 'getTournamentHistory'] as const)(
    'propagates errors from %s', async (method) => {
      get.mockRejectedValue(new Error('not found'));
      await expect(repository[method]('missing', baseUrl)).rejects.toThrow('not found');
    }
  );

  it('returns an empty catalogue only after both APIs fail', async () => {
    get.mockRejectedValue(new Error('offline'));
    await expect(repository.getRecentTournaments()).resolves.toEqual([]);
    expect(get.mock.calls).toEqual([
      ['/recently-view', API_CONFIG.goChampsBaseUrl],
      ['/v1/recently-view', API_CONFIG.stagingBaseUrl],
    ]);
  });
});
