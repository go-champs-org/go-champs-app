import { GoChampsApiClient } from '../../datasources/remote/GoChampsApiClient';
import { TournamentFallbackDataSource } from '../../datasources/local/TournamentFallbackDataSource';
import { GoChampsTournamentRepository } from '../GoChampsTournamentRepository';
import { API_CONFIG } from '../../../core/config/apiConfig';
import {
  classificationDataFixture,
  gamesFixture,
  tournamentFixture,
  tournamentHistoryFixture,
} from '../../../test/fixtures/tournamentFixtures';

const createApiClient = (get: jest.Mock) =>
  ({
    get,
  }) as unknown as GoChampsApiClient;

const createFallback = (): TournamentFallbackDataSource =>
  ({
    getGames: jest.fn(() => gamesFixture),
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

  it('searches tournaments on the public api', async () => {
    const get = jest.fn().mockResolvedValue({ data: [tournamentFixture] });
    const repository = new GoChampsTournamentRepository(createApiClient(get), createFallback());

    await expect(repository.searchTournaments('copa sul')).resolves.toEqual([
      { ...tournamentFixture, apiBaseUrl: API_CONFIG.goChampsBaseUrl },
    ]);
    expect(get).toHaveBeenCalledWith('/search?term=copa%20sul', API_CONFIG.goChampsBaseUrl);
  });

  it('answers no search results when the response has no data', async () => {
    const repository = new GoChampsTournamentRepository(createApiClient(jest.fn().mockResolvedValue({})), createFallback());

    await expect(repository.searchTournaments('copa')).resolves.toEqual([]);
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

    await expect(repository.getPhase('phase-1')).resolves.toEqual(classificationDataFixture);
    await expect(repository.getGamesByPhaseId('phase-1')).resolves.toEqual(gamesFixture);
  });
});
