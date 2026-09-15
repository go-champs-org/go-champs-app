import { act, renderHook, waitFor } from '@testing-library/react-native';
import { container } from '../../di/container';
import { useClassificationViewModel } from '../ClassificationViewModel';
import { useGroupPhaseViewModel } from '../GroupPhaseViewModel';
import { usePlayoffViewModel } from '../PlayoffViewModel';
import { gamesFixture, classificationDataFixture, groupPhaseDataFixture } from '../../test/fixtures/tournamentFixtures';
import { deferred } from '../../test/deferred';

jest.mock('../../di/container', () => ({ container: {
  getClassificationOverview: { execute: jest.fn() },
  getGroupPhaseOverview: { execute: jest.fn() },
  getPlayoffOverview: { execute: jest.fn() },
} }));

const overview = {
  classificationData: classificationDataFixture,
  groupPhaseData: groupPhaseDataFixture,
  classificationRows: [], groups: [], sortedStats: [], draws: [],
  games: gamesFixture,
  teamMap: { 'team-a': { name: 'Alpha', logo_url: null } },
};

const cases = [
  { name: 'classification', useModel: (id: string) => useClassificationViewModel(id, 'tournament', 'https://test'), service: container.getClassificationOverview },
  { name: 'groups', useModel: (id: string) => useGroupPhaseViewModel(id, 'tournament', 'https://test'), service: container.getGroupPhaseOverview },
  { name: 'playoffs', useModel: (id: string) => usePlayoffViewModel(id, 'https://test', 'phase'), service: container.getPlayoffOverview },
];

describe.each(cases)('$name viewmodel', ({ useModel, service }) => {
  const execute = service.execute as jest.Mock;
  beforeEach(() => execute.mockReset());

  it('loads teams and selects the earliest match date, with date and tab navigation', async () => {
    execute.mockResolvedValue(overview);
    const { result } = renderHook(() => useModel('id'));
    expect(result.current.loading).toBe(true);
    expect(result.current.gamesForSelectedDate).toEqual([]);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.dateKeys).toEqual(['2026-01-01', '2026-01-02']);
    expect(result.current.gamesForSelectedDate.map((game) => game.id)).toEqual(['game-1']);
    act(() => {
      result.current.setActiveTab('Partidas');
      result.current.setSelectedDate('2026-01-02');
    });
    expect(result.current.activeTab).toBe('Partidas');
    expect(result.current.gamesForSelectedDate.map((game) => game.id)).toEqual(['game-2']);
    expect(result.current.teamMap['team-a'].name).toBe('Alpha');
  });

  it.each([new Error('Falha de rede'), null])('exposes failure and stops loading (%s)', async (failure) => {
    execute.mockRejectedValue(failure);
    const { result } = renderHook(() => useModel('id'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(failure?.message ?? 'Erro ao carregar dados');
    expect(result.current.gamesForSelectedDate).toEqual([]);
  });

  it('handles phases with no matches', async () => {
    execute.mockResolvedValue({ ...overview, games: [] });
    const { result } = renderHook(() => useModel('id'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.dateKeys).toEqual([]);
    expect(result.current.selectedDate).toBeNull();
  });

  it.each(['resolve', 'reject'] as const)('ignores a stale request that will %s after changing phase', async (settle) => {
    const stale = deferred<typeof overview>();
    execute.mockReturnValueOnce(stale.promise).mockResolvedValue({ ...overview, teamMap: {} });
    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useModel(id) as ReturnType<typeof useClassificationViewModel>,
      { initialProps: { id: 'old' } }
    );
    rerender({ id: 'new' });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      if (settle === 'resolve') stale.resolve(overview);
      else stale.reject(new Error('old error'));
    });
    expect(result.current.teamMap).toEqual({});
    expect(result.current.error).toBeNull();
  });
});
