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
