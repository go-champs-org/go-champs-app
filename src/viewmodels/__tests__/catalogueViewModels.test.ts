import { renderHook, waitFor } from '@testing-library/react-native';
import { container } from '../../di/container';
import { tournamentFixture, tournamentHistoryFixture } from '../../test/fixtures/tournamentFixtures';
import { useOrganizationViewModel } from '../OrganizationViewModel';
import { useTournamentHistoryViewModel } from '../TournamentHistoryViewModel';
import { useTournamentsViewModel } from '../TournamentsViewModel';

jest.mock('../../di/container', () => ({
  container: {
    getRecentTournaments: { execute: jest.fn() },
    getTournamentHistory: { execute: jest.fn() },
    getOrganizations: { execute: jest.fn() },
  },
}));

describe('catalogue viewmodels', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads the recent tournament catalogue', async () => {
    (container.getRecentTournaments.execute as jest.Mock).mockResolvedValue([tournamentFixture]);
    const { result } = renderHook(() => useTournamentsViewModel());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tournaments).toEqual([tournamentFixture]);
  });

  it('finishes loading with an empty catalogue after failure', async () => {
    (container.getRecentTournaments.execute as jest.Mock).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useTournamentsViewModel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tournaments).toEqual([]);
  });

  it('loads organizations', async () => {
    (container.getOrganizations.execute as jest.Mock).mockResolvedValue([tournamentFixture.organization]);
    const { result } = renderHook(() => useOrganizationViewModel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.organizations).toEqual([tournamentFixture.organization]);
  });

  it('loads tournament history using its source URL', async () => {
    (container.getTournamentHistory.execute as jest.Mock).mockResolvedValue(tournamentHistoryFixture);
    const { result } = renderHook(() => useTournamentHistoryViewModel('tournament-1', 'https://source.test'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(container.getTournamentHistory.execute).toHaveBeenCalledWith('tournament-1', 'https://source.test');
    expect(result.current.tournament).toEqual(tournamentHistoryFixture);
    expect(result.current.error).toBeNull();
  });

  it.each([[new Error('indisponível'), 'indisponível'], [null, 'Erro ao carregar dados do torneio']])(
    'exposes tournament history failures',
    async (failure, message) => {
      (container.getTournamentHistory.execute as jest.Mock).mockRejectedValue(failure);
      const { result } = renderHook(() => useTournamentHistoryViewModel('tournament-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.tournament).toBeNull();
      expect(result.current.error).toBe(message);
    }
  );
});
