import { TournamentRepository } from '../../repositories/TournamentRepository';
import { GetClassificationOverviewUseCase } from '../GetClassificationOverviewUseCase';
import { GetGroupPhaseOverviewUseCase } from '../GetGroupPhaseOverviewUseCase';
import { GetPlayoffOverviewUseCase } from '../GetPlayoffOverviewUseCase';
import { ResolvePhaseDestinationUseCase } from '../ResolvePhaseDestinationUseCase';
import { buildTeamMap } from '../shared/phasePresentation';
import { classificationDataFixture, gamesFixture, tournamentDetailsFixture } from '../../../test/fixtures/tournamentFixtures';
import { Phase } from '../../../models/TournamentHistory';
import { Game } from '../../../models/GameModel';

const missingTeams = [
  { id: 'a', team_id: 'missing-a', placeholder: 'Vencedor A', stats: {} },
  { id: 'b', team_id: 'missing-b', placeholder: null, stats: { wins: 3 } },
];

describe.each(['classification', 'group'] as const)('%s overview edge cases', (kind) => {
  const make = (ranking = 1) => {
    const data = {
      ...classificationDataFixture,
      elimination_stats: [{ ...classificationDataFixture.elimination_stats[0], ranking_order: ranking }],
      eliminations: [{ ...classificationDataFixture.eliminations[0], team_stats: missingTeams }],
    };
    const repository = {
      getClassificationData: jest.fn().mockResolvedValue(data),
      getGroupPhaseData: jest.fn().mockResolvedValue(data),
      getGamesByPhaseId: jest.fn().mockResolvedValue([]),
      getTournamentDetails: jest.fn().mockRejectedValue(new Error('metadata offline')),
    };
    const typed = repository as unknown as TournamentRepository;
    return {
      repository,
      execute: async (id?: string) => {
        if (kind === 'classification') return (await new GetClassificationOverviewUseCase(typed).execute('phase', id)).classificationRows;
        return (await new GetGroupPhaseOverviewUseCase(typed).execute('phase', id)).groups[0].rows;
      },
    };
  };

  it('keeps standings readable when team metadata fails and scores are absent', async () => {
    const { execute } = make();
    const rows = await execute('tournament');
    expect(rows.map((row) => row.team.name)).toEqual(['Time', 'Vencedor A']);
    expect(rows.map((row) => row.stats.wins)).toEqual([3, 0]);
    expect(rows.every((row) => row.team.logo_url === null)).toBe(true);
  });

  it('preserves original order without a ranking statistic or tournament id', async () => {
    const { execute, repository } = make(0);
    expect((await execute()).map((row) => row.team.name)).toEqual(['Vencedor A', 'Time']);
    expect(repository.getTournamentDetails).not.toHaveBeenCalled();
  });
});

describe('Playoff edge cases', () => {
  it.each([
    [[{ id: 'draw', type: 'draw', title: 'Finals' }], 'draw'],
    [[], 'tournament'],
  ])('selects an available bracket without requiring a title', async (phases, expected) => {
    const repository = {
      getTournamentDetails: jest.fn().mockResolvedValue({ ...tournamentDetailsFixture, phases }),
      getPlayoffData: jest.fn().mockResolvedValue({}),
      getGamesByPhaseId: jest.fn().mockResolvedValue([]),
      getSportConfig: jest.fn().mockRejectedValue(new Error('sport offline')),
    };
    const overview = await new GetPlayoffOverviewUseCase(repository as unknown as TournamentRepository).execute('tournament');
    expect(repository.getPlayoffData).toHaveBeenCalledWith(expected, undefined);
    expect(overview.draws).toEqual([]);
    expect(overview.teamMap).toEqual({});
  });
});

describe('Team identity and phase guards', () => {
  it('keeps names while explicitly omitting logos', () => {
    const map = buildTeamMap(gamesFixture, tournamentDetailsFixture, { includeLogos: false });
    expect(map['team-a']).toEqual({ name: 'Alpha', logo_url: null });
    expect(map['team-b']).toEqual({ name: 'Beta', logo_url: null });
  });

  it('accepts games with undecided teams', () => {
    const undecidedGame = { ...gamesFixture[0], home_team: null, away_team: null } as unknown as Game;
    expect(buildTeamMap([undecidedGame])).toEqual({});
  });

  it('ignores an untyped phase', () => {
    expect(new ResolvePhaseDestinationUseCase().execute({ title: '', type: '' } as Phase)).toBeNull();
  });
});
