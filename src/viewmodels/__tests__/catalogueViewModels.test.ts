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
    getPinnedTournamentIds: { execute: jest.fn() },
    togglePinnedTournament: { execute: jest.fn() },
  },
}));

describe('catalogue viewmodels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (container.getPinnedTournamentIds.execute as jest.Mock).mockResolvedValue([]);
  });

  it('loads the recent tournament catalogue', async () => {
    (container.getRecentTournaments.execute as jest.Mock).mockResolvedValue([tournamentFixture]);
    const { result } = renderHook(() => useTournamentsViewModel());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tournaments).toEqual([tournamentFixture]);
  });

  it('sorts pinned tournaments first and toggles pin state', async () => {
    const second = { ...tournamentFixture, id: 'tournament-2', name: 'Liga Norte' };
    (container.getRecentTournaments.execute as jest.Mock).mockResolvedValue([tournamentFixture, second]);
    (container.getPinnedTournamentIds.execute as jest.Mock).mockResolvedValue(['tournament-2']);
    (container.togglePinnedTournament.execute as jest.Mock).mockResolvedValue(['tournament-1', 'tournament-2']);

    const { result } = renderHook(() => useTournamentsViewModel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tournaments.map((item) => item.id)).toEqual(['tournament-2', 'tournament-1']);
    expect(result.current.pinnedIds.has('tournament-2')).toBe(true);

    await result.current.togglePin('tournament-1');
    await waitFor(() => expect(result.current.pinnedIds.has('tournament-1')).toBe(true));
    expect(container.togglePinnedTournament.execute).toHaveBeenCalledWith('tournament-1');
  });

  it('finishes loading with an empty catalogue after failure', async () => {
    (container.getRecentTournaments.execute as jest.Mock).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useTournamentsViewModel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tournaments).toEqual([]);
  });

  it('keeps previous pins when toggle fails', async () => {
    (container.getRecentTournaments.execute as jest.Mock).mockResolvedValue([tournamentFixture]);
    (container.getPinnedTournamentIds.execute as jest.Mock).mockResolvedValue(['tournament-1']);
    (container.togglePinnedTournament.execute as jest.Mock).mockRejectedValue(new Error('disk full'));

    const { result } = renderHook(() => useTournamentsViewModel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await result.current.togglePin('tournament-1');
    await waitFor(() => expect(result.current.pinnedIds.has('tournament-1')).toBe(true));
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
