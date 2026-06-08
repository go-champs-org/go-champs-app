import { GoChampsApiClient } from '../../datasources/remote/GoChampsApiClient';
import { TournamentFallbackDataSource } from '../../datasources/local/TournamentFallbackDataSource';
import { GoChampsTournamentRepository } from '../GoChampsTournamentRepository';
import { API_CONFIG } from '../../../core/config/apiConfig';
import {
  classificationDataFixture,
  gamesFixture,
  playoffResponseFixture,
  tournamentDetailsFixture,
  tournamentFixture,
  tournamentHistoryFixture,
} from '../../../test/fixtures/tournamentFixtures';

const createApiClient = (get: jest.Mock) =>
  ({
    get,
  }) as unknown as GoChampsApiClient;

const createFallback = (): TournamentFallbackDataSource =>
  ({
    getTournamentDetails: jest.fn(() => tournamentDetailsFixture),
    getPlayoffData: jest.fn(() => playoffResponseFixture),
    getGames: jest.fn(() => gamesFixture),
    getSportConfig: jest.fn(() => ({ name: 'Basketball', slug: 'basketball' })),
  }) as unknown as TournamentFallbackDataSource;

describe('GoChampsTournamentRepository', () => {
  it('maps recent tournaments from staging response', async () => {
    const repository = new GoChampsTournamentRepository(
      createApiClient(jest.fn().mockResolvedValue({ data: [{ tournament: tournamentFixture }] })),
      createFallback()
    );

    await expect(repository.getRecentTournaments()).resolves.toEqual([
      { ...tournamentFixture, apiBaseUrl: API_CONFIG.goChampsBaseUrl },
    ]);
  });

  it('falls back to staging recent tournaments when public api fails', async () => {
    const repository = new GoChampsTournamentRepository(
      createApiClient(
        jest
          .fn()
          .mockRejectedValueOnce(new Error('cloudflare'))
          .mockResolvedValueOnce({ data: [{ tournament: tournamentFixture }] })
      ),
      createFallback()
    );

    await expect(repository.getRecentTournaments()).resolves.toEqual([
      { ...tournamentFixture, apiBaseUrl: `${API_CONFIG.stagingBaseUrl}/v1` },
    ]);
  });

  it('returns fallback tournament details when remote fails', async () => {
    const fallback = createFallback();
    const repository = new GoChampsTournamentRepository(
      createApiClient(jest.fn().mockRejectedValue(new Error('offline'))),
      fallback
    );

    await expect(repository.getTournamentDetails('tournament-1')).resolves.toEqual(tournamentDetailsFixture);
    expect(fallback.getTournamentDetails).toHaveBeenCalled();
  });

  it('keeps tournament history errors explicit', async () => {
    const repository = new GoChampsTournamentRepository(
      createApiClient(jest.fn().mockResolvedValue(tournamentHistoryFixture.data)),
      createFallback()
    );

    await expect(repository.getTournamentHistory('tournament-1')).resolves.toEqual(tournamentHistoryFixture);
  });

  it('loads phase-specific data', async () => {
    const get = jest
      .fn()
      .mockResolvedValueOnce({ data: classificationDataFixture })
      .mockResolvedValueOnce({ data: gamesFixture });
    const repository = new GoChampsTournamentRepository(createApiClient(get), createFallback());

    await expect(repository.getClassificationData('phase-1')).resolves.toEqual(classificationDataFixture);
    await expect(repository.getGamesByPhaseId('phase-1')).resolves.toEqual(gamesFixture);
  });
});
