import { GoChampsApiClient } from '../../datasources/remote/GoChampsApiClient';
import { GoChampsOrganizationRepository } from '../GoChampsOrganizationRepository';
import { tournamentFixture } from '../../../test/fixtures/tournamentFixtures';

const API = 'https://api.test/v1';

const createApiClient = (get: jest.Mock) =>
  ({
    get,
  }) as unknown as GoChampsApiClient;

describe('GoChampsOrganizationRepository', () => {
  it('finds the organization by its slug', async () => {
    const get = jest.fn().mockResolvedValue({ data: [tournamentFixture.organization] });
    const repository = new GoChampsOrganizationRepository(createApiClient(get));

    await expect(repository.getOrganizationBySlug('go champs', API)).resolves.toEqual(tournamentFixture.organization);
    expect(get).toHaveBeenCalledWith('/organizations?where[slug]=go%20champs', API);
  });

  it('answers null when no organization has the slug', async () => {
    const repository = new GoChampsOrganizationRepository(createApiClient(jest.fn().mockResolvedValue({ data: [] })));

    await expect(repository.getOrganizationBySlug('missing')).resolves.toBeNull();
  });

  it('answers null when the response has no data', async () => {
    const repository = new GoChampsOrganizationRepository(createApiClient(jest.fn().mockResolvedValue({})));

    await expect(repository.getOrganizationBySlug('missing')).resolves.toBeNull();
  });

  it('lets a failed organization request fail', async () => {
    const repository = new GoChampsOrganizationRepository(
      createApiClient(jest.fn().mockRejectedValue(new Error('offline')))
    );

    await expect(repository.getOrganizationBySlug('go-champs')).rejects.toThrow('offline');
  });

  it('loads the tournaments of the organization', async () => {
    const get = jest.fn().mockResolvedValue({ data: [tournamentFixture] });
    const repository = new GoChampsOrganizationRepository(createApiClient(get));

    await expect(repository.getTournamentsByOrganizationSlug('go-champs', API)).resolves.toEqual([tournamentFixture]);
    expect(get).toHaveBeenCalledWith('/tournaments?where[organization_slug]=go-champs', API);
  });

  it('answers an empty tournament list when the response has no data', async () => {
    const repository = new GoChampsOrganizationRepository(createApiClient(jest.fn().mockResolvedValue({})));

    await expect(repository.getTournamentsByOrganizationSlug('go-champs')).resolves.toEqual([]);
  });
});
