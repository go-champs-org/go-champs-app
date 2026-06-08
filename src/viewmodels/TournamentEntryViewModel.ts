import { useCallback, useState } from 'react';
import { NavigationProp } from '@react-navigation/native';
import { container } from '../di/container';
import { RootStackParamList } from '../navigation/types';
import { Tournament } from '../models/Tournament';
import { PhaseDestination } from '../domain/usecases/ResolvePhaseDestinationUseCase';

export type SelectablePhase = PhaseDestination;

const navigateToDestination = (
  navigation: NavigationProp<RootStackParamList>,
  tournamentId: string,
  destination: PhaseDestination,
  apiBaseUrl?: string
) => {
  if (destination.route === 'PlayoffsView') {
    navigation.navigate('PlayoffsView', { tournamentId, phaseId: destination.phase.id, apiBaseUrl });
    return;
  }

  if (destination.route === 'ClassificationView') {
    navigation.navigate('ClassificationView', {
      phaseId: destination.phase.id,
      tournamentId,
      apiBaseUrl,
    });
    return;
  }

  navigation.navigate('GroupPhaseView', {
    phaseId: destination.phase.id,
    tournamentId,
    apiBaseUrl,
  });
};

export const useTournamentEntryViewModel = (navigation: NavigationProp<RootStackParamList>) => {
  const [loadingTournamentId, setLoadingTournamentId] = useState<string | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [selectablePhases, setSelectablePhases] = useState<SelectablePhase[]>([]);
  const [error, setError] = useState<string | null>(null);

  const closePhasePicker = useCallback(() => {
    setSelectedTournament(null);
    setSelectablePhases([]);
  }, []);

  const selectPhase = useCallback(
    (destination: SelectablePhase) => {
      if (!selectedTournament) return;
      const tournament = selectedTournament;
      closePhasePicker();
      navigateToDestination(navigation, tournament.id, destination, tournament.apiBaseUrl);
    },
    [closePhasePicker, navigation, selectedTournament]
  );

  const openTournament = useCallback(
    async (tournament: Tournament) => {
      setLoadingTournamentId(tournament.id);
      setError(null);

      try {
        const history = await container.getTournamentHistory.execute(tournament.id, tournament.apiBaseUrl);
        const phases = history.data.phases
          .map((phase) => container.resolvePhaseDestination.execute(phase))
          .filter((phase): phase is PhaseDestination => Boolean(phase));

        if (phases.length === 1) {
          navigateToDestination(navigation, tournament.id, phases[0], tournament.apiBaseUrl);
          return;
        }

        if (phases.length > 1) {
          setSelectedTournament(tournament);
          setSelectablePhases(phases);
          return;
        }

        setError('Este campeonato ainda não possui fases disponíveis.');
      } catch (entryError: any) {
        setError(entryError?.message || 'Não foi possível abrir o campeonato.');
      } finally {
        setLoadingTournamentId(null);
      }
    },
    [navigation]
  );

  return {
    closePhasePicker,
    error,
    loadingTournamentId,
    openTournament,
    selectablePhases,
    selectedTournament,
    selectPhase,
  };
};
