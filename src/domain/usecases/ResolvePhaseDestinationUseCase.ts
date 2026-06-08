import { Phase } from '../../models/TournamentHistory';

export type PhaseDestination =
  | {
      route: 'PlayoffsView';
      phase: Phase;
      description: string;
    }
  | {
      route: 'ClassificationView';
      phase: Phase;
      description: string;
    }
  | {
      route: 'GroupPhaseView';
      phase: Phase;
      description: string;
    };

export class ResolvePhaseDestinationUseCase {
  execute(phase: Phase): PhaseDestination | null {
    const titleLower = (phase.title || '').toLowerCase();
    const typeLower = (phase.type || '').toLowerCase();

    if (typeLower === 'draw' || titleLower.includes('playoff')) {
      return {
        route: 'PlayoffsView',
        phase,
        description: 'Chaveamento e partidas',
      };
    }

    if (typeLower !== 'elimination') {
      return null;
    }

    if (titleLower.includes('classificação') || titleLower.includes('classificacao')) {
      return {
        route: 'ClassificationView',
        phase,
        description: 'Tabela e partidas',
      };
    }

    return {
      route: 'GroupPhaseView',
      phase,
      description: 'Grupos e partidas',
    };
  }
}

