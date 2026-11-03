import { EliminationStat } from '../../../../models/EliminationModel';
import { standingsColumns, standingsLegend, visibleStats } from '../standingsPresentation';

const stat = (id: string, title: string, ranking_order = 0, ranking_criteria?: string | null): EliminationStat => ({
  id, title, ranking_order, ranking_criteria, team_stat_source: 'manual',
});

describe('standingsPresentation', () => {
  it('shows only overall criteria, or every stat when the payload has none', () => {
    const stats = [stat('w', 'V', 1, 'overall'), stat('h2h', 'Confronto', 2, 'head_to_head'), stat('g', 'J', 0, null)];
    expect(visibleStats(stats).map((item) => item.id)).toEqual(['w', 'g']);
  });

  it('keeps short titles, abbreviates long ones and spells them out in the legend', () => {
    const columns = standingsColumns([
      stat('g', 'Jogos'),
      stat('w', 'V', 1),
      stat('pp', 'Pontos pró'),
      stat('sp', 'Saldo de pontos', 2),
    ]);
    expect(columns).toEqual([
      { id: 'g', label: 'J', title: 'Jogos', emphasized: false },
      { id: 'w', label: 'V', title: 'V', emphasized: true },
      { id: 'pp', label: 'PP', title: 'Pontos pró', emphasized: false },
      { id: 'sp', label: 'SP', title: 'Saldo de pontos', emphasized: true },
    ]);
    expect(standingsLegend(columns)).toBe('J Jogos · PP Pontos pró · SP Saldo de pontos');
  });

  it('keeps three letters when two titles would share initials', () => {
    const columns = standingsColumns([stat('p', 'Pontos'), stat('d', 'Partidas'), stat('v', 'Vitórias')]);
    expect(columns.map((column) => column.label)).toEqual(['PON', 'PAR', 'V']);
  });
});
