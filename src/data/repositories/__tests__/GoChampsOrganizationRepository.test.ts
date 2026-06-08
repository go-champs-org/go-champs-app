import { GoChampsApiClient } from '../../datasources/remote/GoChampsApiClient';
import { GoChampsOrganizationRepository } from '../GoChampsOrganizationRepository';
import { tournamentFixture } from '../../../test/fixtures/tournamentFixtures';

const createApiClient = (get: jest.Mock) =>
  ({
    get,
  }) as unknown as GoChampsApiClient;

describe('GoChampsOrganizationRepository', () => {
  it('loads organizations from api', async () => {
    const repository = new GoChampsOrganizationRepository(
      createApiClient(jest.fn().mockResolvedValue({ data: [tournamentFixture.organization] }))
    );

    await expect(repository.getOrganizations()).resolves.toEqual([tournamentFixture.organization]);
  });

  it('returns an empty list when api fails', async () => {
    const repository = new GoChampsOrganizationRepository(
      createApiClient(jest.fn().mockRejectedValue(new Error('offline')))
    );

    await expect(repository.getOrganizations()).resolves.toEqual([]);
  });
});

