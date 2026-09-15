import { act, renderHook } from '@testing-library/react-native';
import { NavigationProp } from '@react-navigation/native';
import { container } from '../../di/container';
import { useTournamentEntryViewModel } from '../TournamentEntryViewModel';
import { ResolvePhaseDestinationUseCase } from '../../domain/usecases/ResolvePhaseDestinationUseCase';
import { RootStackParamList } from '../../navigation/types';
import { tournamentFixture, tournamentHistoryFixture } from '../../test/fixtures/tournamentFixtures';
import { Phase } from '../../models/TournamentHistory';
import { deferred } from '../../test/deferred';

jest.mock('../../di/container', () => ({ container: {
  getTournamentHistory: { execute: jest.fn() },
  resolvePhaseDestination: { execute: jest.fn() },
} }));

const phases: Phase[] = [
  { id: 'draw', title: 'Playoffs', type: 'draw', elimination_stats: [], is_in_progress: true, order: 1 },
  { id: 'table', title: 'Classificação', type: 'elimination', elimination_stats: [], is_in_progress: true, order: 2 },
  { id: 'groups', title: 'Grupos', type: 'elimination', elimination_stats: [], is_in_progress: true, order: 3 },
];
const tournament = { ...tournamentFixture, apiBaseUrl: 'https://staging.test/v1' };
const history = (selected: Phase[]) => ({ data: { ...tournamentHistoryFixture.data, phases: selected } });

describe('Tournament entry', () => {
  const navigate = jest.fn();
  const navigation = { navigate } as unknown as NavigationProp<RootStackParamList>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(container.resolvePhaseDestination.execute).mockImplementation((phase) => new ResolvePhaseDestinationUseCase().execute(phase));
  });

  it.each(phases)('opens a sole $title phase directly preserving the API origin', async (phase) => {
    jest.mocked(container.getTournamentHistory.execute).mockResolvedValue(history([phase]));
    const { result } = renderHook(() => useTournamentEntryViewModel(navigation));
    await act(async () => result.current.openTournament(tournament));
    expect(navigate).toHaveBeenCalledWith(new ResolvePhaseDestinationUseCase().execute(phase)!.route, {
      tournamentId: tournament.id, phaseId: phase.id, apiBaseUrl: tournament.apiBaseUrl,
    });
    expect(result.current.selectedTournament).toBeNull();
    expect(result.current.loadingTournamentId).toBeNull();
  });

  it('shows multiple supported phases, navigates after selection and closes the picker', async () => {
    jest.mocked(container.getTournamentHistory.execute).mockResolvedValue(history([...phases, { ...phases[0], id: 'unknown', type: 'unknown', title: 'Draft' }]));
    const { result } = renderHook(() => useTournamentEntryViewModel(navigation));
    await act(async () => result.current.openTournament(tournament));
    expect(navigate).not.toHaveBeenCalled();
    expect(result.current.selectablePhases).toHaveLength(3);
    act(() => result.current.selectPhase(result.current.selectablePhases[1]));
    expect(navigate).toHaveBeenCalledWith('ClassificationView', expect.objectContaining({ phaseId: 'table' }));
    expect(result.current.selectedTournament).toBeNull();
    expect(result.current.selectablePhases).toEqual([]);
  });

  it('cancels selection without navigating and ignores selection after closing', async () => {
    jest.mocked(container.getTournamentHistory.execute).mockResolvedValue(history(phases));
    const { result } = renderHook(() => useTournamentEntryViewModel(navigation));
    await act(async () => result.current.openTournament(tournament));
    const phase = result.current.selectablePhases[0];
    act(() => result.current.closePhasePicker());
    act(() => result.current.selectPhase(phase));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('explains when there are no available phases', async () => {
    jest.mocked(container.getTournamentHistory.execute).mockResolvedValue(history([]));
    const { result } = renderHook(() => useTournamentEntryViewModel(navigation));
    await act(async () => result.current.openTournament(tournament));
    expect(result.current.error).toBe('Este campeonato ainda não possui fases disponíveis.');
    expect(navigate).not.toHaveBeenCalled();
  });

  it.each([new Error('Campeonato indisponível'), null])('recovers from a failed opening (%s)', async (failure) => {
    jest.mocked(container.getTournamentHistory.execute).mockRejectedValueOnce(failure).mockResolvedValueOnce(history(phases));
    const { result } = renderHook(() => useTournamentEntryViewModel(navigation));
    await act(async () => result.current.openTournament(tournament));
    expect(result.current.error).toBe('Não foi possível abrir o campeonato. Tente novamente.');
    await act(async () => result.current.openTournament(tournament));
    expect(result.current.error).toBeNull();
    expect(result.current.selectablePhases).toHaveLength(3);
  });

  it('exposes the pending tournament while awaiting the API', async () => {
    const pending = deferred<ReturnType<typeof history>>();
    jest.mocked(container.getTournamentHistory.execute).mockReturnValue(pending.promise);
    const { result } = renderHook(() => useTournamentEntryViewModel(navigation));
    let opening!: Promise<void>;
    act(() => { opening = result.current.openTournament(tournament); });
    expect(result.current.loadingTournamentId).toBe(tournament.id);
    await act(async () => { pending.resolve(history([])); await opening; });
    expect(result.current.loadingTournamentId).toBeNull();
  });
});
