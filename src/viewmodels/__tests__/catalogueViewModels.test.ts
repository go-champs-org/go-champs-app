import { act, renderHook, waitFor } from '@testing-library/react-native';
import { container } from '../../di/container';
import { tournamentFixture } from '../../test/fixtures/tournamentFixtures';
import { SEARCH_DEBOUNCE_MS, useTournamentsViewModel } from '../TournamentsViewModel';

jest.mock('../../di/container', () => ({
  container: {
    getRecentTournaments: { execute: jest.fn() },
    getPinnedTournamentIds: { execute: jest.fn() },
    searchTournaments: { execute: jest.fn() },
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

  it('searches the API after the debounce and goes back to the recent list when cleared', async () => {
    jest.useFakeTimers();
    const found = { ...tournamentFixture, id: 'found', name: 'Liga Norte' };
    (container.getRecentTournaments.execute as jest.Mock).mockResolvedValue([tournamentFixture]);
    (container.searchTournaments.execute as jest.Mock).mockResolvedValue([found]);

    const { result } = renderHook(() => useTournamentsViewModel());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setSearchQuery('norte'));
    expect(result.current.isSearchMode).toBe(true);
    expect(result.current.searching).toBe(true);
    expect(result.current.tournaments).toEqual([]);
    expect(container.searchTournaments.execute).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });
    await waitFor(() => expect(result.current.searching).toBe(false));
    expect(container.searchTournaments.execute).toHaveBeenCalledWith('norte');
    expect(result.current.tournaments).toEqual([found]);

    act(() => result.current.setSearchQuery(''));
    expect(result.current.isSearchMode).toBe(false);
    expect(result.current.tournaments).toEqual([tournamentFixture]);
    jest.useRealTimers();
  });

  it('shows no results when the search fails', async () => {
    jest.useFakeTimers();
    (container.getRecentTournaments.execute as jest.Mock).mockResolvedValue([tournamentFixture]);
    (container.searchTournaments.execute as jest.Mock).mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useTournamentsViewModel());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setSearchQuery('copa'));
    act(() => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });
    await waitFor(() => expect(result.current.searching).toBe(false));
    expect(result.current.tournaments).toEqual([]);
    jest.useRealTimers();
  });

  it('ignores results that arrive after the term changed', async () => {
    jest.useFakeTimers();
    let resolveFirst: (value: unknown) => void = () => undefined;
    (container.getRecentTournaments.execute as jest.Mock).mockResolvedValue([]);
    (container.searchTournaments.execute as jest.Mock)
      .mockReturnValueOnce(new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce([tournamentFixture]);

    const { result } = renderHook(() => useTournamentsViewModel());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setSearchQuery('a'));
    act(() => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });
    act(() => result.current.setSearchQuery('copa'));
    act(() => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });
    await waitFor(() => expect(result.current.searching).toBe(false));
    await act(async () => {
      resolveFirst([{ ...tournamentFixture, id: 'stale' }]);
    });
    expect(result.current.tournaments).toEqual([tournamentFixture]);
    jest.useRealTimers();
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
