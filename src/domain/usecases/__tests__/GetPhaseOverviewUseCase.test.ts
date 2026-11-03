import { TournamentRepository } from '../../repositories/TournamentRepository';
import { GetPhaseOverviewUseCase } from '../GetPhaseOverviewUseCase';
import { classificationDataFixture, gamesFixture, groupPhaseDataFixture, playoffResponseFixture, tournamentDetailsFixture } from '../../../test/fixtures/tournamentFixtures';

const teams = tournamentDetailsFixture.teams.map((team) => ({ id: team.id, name: team.name, logo_url: team.logo_url }));

const repositoryWith = (phase: unknown, games: Promise<unknown> = Promise.resolve(gamesFixture)) =>
  ({
    getPhase: jest.fn().mockResolvedValue(phase),
    getGamesByPhaseId: jest.fn().mockReturnValue(games),
  }) as unknown as TournamentRepository;

describe('GetPhaseOverviewUseCase', () => {
  it('builds standings groups in order, keeping the API ranking', async () => {
    const repository = repositoryWith(groupPhaseDataFixture);
    const overview = await new GetPhaseOverviewUseCase(repository).execute('phase-group', 'standings', teams, 'https://api.test/v1');

    expect(repository.getPhase).toHaveBeenCalledWith('phase-group', 'https://api.test/v1');
    expect(repository.getGamesByPhaseId).toHaveBeenCalledWith('phase-group', 'https://api.test/v1');
    if (overview.kind !== 'standings') throw new Error('expected standings');
    expect(overview.groups.map((group) => group.title)).toEqual(['Grupo B', 'Grupo A']);
    expect(overview.groups[0].rows.map((row) => [row.team.name, row.values.wins])).toEqual([['Alpha', '1'], ['Beta', '3']]);
    expect(overview.columns).toEqual([{ id: 'wins', label: 'V', title: 'V', emphasized: true }]);
    expect(overview.legend).toBe('');
    expect(overview.games.map((game) => game.id)).toEqual(['game-1', 'game-2']);
  });

  it('labels unknown teams by placeholder and missing stats with a dash', async () => {
    const phase = {
      ...classificationDataFixture,
      eliminations: [{
        ...classificationDataFixture.eliminations[0],
        team_stats: [
          { id: 'x', team_id: 'missing', placeholder: 'Vencedor A', stats: {} },
          { id: 'y', team_id: 'missing-2', placeholder: null, stats: { wins: 0 } },
        ],
      }],
    };
    const overview = await new GetPhaseOverviewUseCase(repositoryWith(phase, Promise.resolve([]))).execute('p', 'standings', []);
    if (overview.kind !== 'standings') throw new Error('expected standings');
    expect(overview.groups[0].rows.map((row) => [row.team.name, row.values.wins])).toEqual([['Vencedor A', '-'], ['A definir', '0']]);
  });

  it('returns a sorted bracket and survives unreachable games', async () => {
    const repository = repositoryWith({ ...classificationDataFixture, draws: playoffResponseFixture.data.draws }, Promise.reject(new Error('offline')));
    const overview = await new GetPhaseOverviewUseCase(repository).execute('phase-playoff', 'bracket', teams);
    if (overview.kind !== 'bracket') throw new Error('expected bracket');
    expect(overview.draws.map((draw) => draw.title)).toEqual(['Semifinal', 'Final']);
    expect(overview.games).toEqual([]);
    expect(overview.teamMap['team-a'].name).toBe('Alpha');
  });
});
