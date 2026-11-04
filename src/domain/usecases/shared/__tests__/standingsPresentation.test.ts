import { EliminationStat } from '../../../../models/EliminationModel';
import { standingsColumns, visibleStats } from '../standingsPresentation';

const stat = (id: string, title: string, ranking_order = 0, ranking_criteria?: string | null): EliminationStat => ({
  id, title, ranking_order, ranking_criteria, team_stat_source: 'manual',
});

describe('standingsPresentation', () => {
  it('shows only overall criteria, or every stat when the payload has none', () => {
    const stats = [stat('w', 'V', 1, 'overall'), stat('h2h', 'Confronto', 2, 'head_to_head'), stat('g', 'J', 0, null)];
    expect(visibleStats(stats).map((item) => item.id)).toEqual(['w', 'g']);
  });

  it('heads each column with the stat title as given', () => {
    expect(standingsColumns([stat('g', ' Jogos '), stat('sp', 'Saldo de pontos', 2)])).toEqual([
      { id: 'g', title: 'Jogos' },
      { id: 'sp', title: 'Saldo de pontos' },
    ]);
  });
});
