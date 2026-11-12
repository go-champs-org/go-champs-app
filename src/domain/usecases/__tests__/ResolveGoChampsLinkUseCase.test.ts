import { ResolveGoChampsLinkUseCase } from '../ResolveGoChampsLinkUseCase';
import { TournamentRepository } from '../../repositories/TournamentRepository';
import { tournamentFixture } from '../../../test/fixtures/tournamentFixtures';

const API = 'https://api.test/v1';
const tournament = { ...tournamentFixture, id: 'tournament-1', apiBaseUrl: API };

const useCaseWith = (getTournamentBySlugs: jest.Mock) => ({
  getTournamentBySlugs,
  useCase: new ResolveGoChampsLinkUseCase({ getTournamentBySlugs } as unknown as TournamentRepository),
});

describe('ResolveGoChampsLinkUseCase', () => {
  it.each([
    ['/', { kind: 'home' }],
    ['/acme', { kind: 'organization', organizationSlug: 'acme' }],
    ['/acme/liga/game/game-1', { kind: 'game', gameId: 'game-1' }],
    ['/About', { kind: 'external', url: 'https://go-champs.com/About' }],
  ])('opens %s without looking the tournament up', async (path, expected) => {
    const { useCase, getTournamentBySlugs } = useCaseWith(jest.fn());

    await expect(useCase.execute(path)).resolves.toEqual(expected);
    expect(getTournamentBySlugs).not.toHaveBeenCalled();
  });

  it.each([
    ['/acme/liga', { kind: 'tournament', tournamentId: 'tournament-1', apiBaseUrl: API }],
    ['/acme/liga/stage/phase-1', { kind: 'tournament', tournamentId: 'tournament-1', apiBaseUrl: API, phaseId: 'phase-1' }],
    ['/acme/liga/stats', { kind: 'stats', tournamentId: 'tournament-1', apiBaseUrl: API }],
    ['/acme/liga/team/team-1', { kind: 'team', tournamentId: 'tournament-1', apiBaseUrl: API, teamId: 'team-1' }],
    ['/acme/liga/athlete/player-1', { kind: 'athlete', tournamentId: 'tournament-1', apiBaseUrl: API, playerId: 'player-1' }],
  ])('looks up the tournament of %s by its slugs', async (path, expected) => {
    const { useCase, getTournamentBySlugs } = useCaseWith(jest.fn().mockResolvedValue(tournament));

    await expect(useCase.execute(path)).resolves.toEqual(expected);
    expect(getTournamentBySlugs).toHaveBeenCalledWith('acme', 'liga');
  });

  it('answers not found, with the tournament page on the site, when no tournament has the slugs', async () => {
    const { useCase } = useCaseWith(jest.fn().mockResolvedValue(null));

    await expect(useCase.execute('/acme/missing/team/team-1')).resolves.toEqual({
      kind: 'notFound',
      url: 'https://go-champs.com/acme/missing',
    });
  });

  it('lets a failed lookup fail', async () => {
    const { useCase } = useCaseWith(jest.fn().mockRejectedValue(new Error('offline')));

    await expect(useCase.execute('/acme/liga')).rejects.toThrow('offline');
  });
});
