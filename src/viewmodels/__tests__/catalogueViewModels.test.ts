import { renderHook, waitFor } from '@testing-library/react-native';
import { container } from '../../di/container';
import { tournamentFixture } from '../../test/fixtures/tournamentFixtures';
import { useTournamentsViewModel } from '../TournamentsViewModel';

jest.mock('../../di/container', () => ({
  container: {
    getRecentTournaments: { execute: jest.fn() },
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
});
