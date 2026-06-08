import { Phase } from '../../../models/TournamentHistory';
import { ResolvePhaseDestinationUseCase } from '../ResolvePhaseDestinationUseCase';

const createPhase = (phase: Partial<Phase>): Phase => ({
  elimination_stats: [],
  id: 'phase-1',
  is_in_progress: true,
  order: 1,
  title: 'Fase',
  type: 'elimination',
  ...phase,
});

describe('ResolvePhaseDestinationUseCase', () => {
  const useCase = new ResolvePhaseDestinationUseCase();

  it('routes draw phases to playoffs', () => {
    expect(useCase.execute(createPhase({ type: 'draw', title: 'Chaveamento' }))?.route).toBe('PlayoffsView');
  });

  it('routes playoff title to playoffs', () => {
    expect(useCase.execute(createPhase({ type: 'anything', title: 'Playoffs' }))?.route).toBe('PlayoffsView');
  });

  it('routes classification elimination to classification', () => {
    expect(useCase.execute(createPhase({ title: 'Classificação' }))?.route).toBe('ClassificationView');
  });

  it('routes ordinary elimination to group phase', () => {
    expect(useCase.execute(createPhase({ title: 'Primeira fase' }))?.route).toBe('GroupPhaseView');
  });

  it('ignores unsupported phases', () => {
    expect(useCase.execute(createPhase({ type: 'other' }))).toBeNull();
  });
});

