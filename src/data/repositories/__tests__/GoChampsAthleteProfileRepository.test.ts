import { AppError } from '../../../core/errors/AppError';
import { HttpClient } from '../../../core/http/HttpClient';
import { GoChampsApiClient } from '../../datasources/remote/GoChampsApiClient';
import { GoChampsAthleteProfileRepository } from '../GoChampsAthleteProfileRepository';

const request = jest.fn();
const httpClient = { request } as unknown as HttpClient;
const apiClient = new GoChampsApiClient(httpClient, { getToken: () => 'tok' });
const repository = new GoChampsAthleteProfileRepository(apiClient);

const athlete = {
  id: 'a1',
  username: 'ana',
  name: 'Ana',
  photo_url: null,
  facebook: null,
  instagram: null,
  twitter: null,
};

describe('GoChampsAthleteProfileRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads athlete profile by username', async () => {
    request.mockResolvedValue({ ok: true, status: 200, data: { data: athlete } });
    await expect(repository.getByUsername('ana')).resolves.toEqual(athlete);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'https://api.go-champs.com/v1/athlete-profiles/username/ana',
      })
    );
  });

  it('returns null when athlete profile is missing', async () => {
    request.mockResolvedValue({ ok: false, status: 404, data: {} });
    await expect(repository.getByUsername('ana')).resolves.toBeNull();
  });

  it('creates athlete profile', async () => {
    request.mockResolvedValue({ ok: true, status: 201, data: { data: athlete } });
    await expect(repository.create({ name: 'Ana' })).resolves.toEqual(athlete);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        body: { athlete_profile: { name: 'Ana' } },
      })
    );
  });

  it('updates athlete profile by username', async () => {
    request.mockResolvedValue({ ok: true, status: 200, data: { data: { ...athlete, name: 'Ana Silva' } } });
    await expect(repository.updateByUsername('ana', { name: 'Ana Silva' })).resolves.toEqual({
      ...athlete,
      name: 'Ana Silva',
    });
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ method: 'PATCH' }));
  });

  it('loads my schedules', async () => {
    request.mockResolvedValue({ ok: true, status: 200, data: { data: [{ id: 'g1' }] } });
    await expect(repository.getMySchedules()).resolves.toEqual([{ id: 'g1' }]);
  });

  it('maps missing athlete schedule auth to a friendly error', async () => {
    request.mockResolvedValue({ ok: false, status: 401, data: { error: 'unauthenticated' } });
    await expect(repository.getMySchedules()).rejects.toEqual(
      new AppError('Complete seu perfil de atleta para ver sua agenda.', 401)
    );
  });

  it('rethrows unexpected getByUsername failures', async () => {
    request.mockResolvedValue({ ok: false, status: 500, data: {} });
    await expect(repository.getByUsername('ana')).rejects.toEqual(new AppError('HTTP error! status: 500', 500));
  });

  it('keeps field errors when a write is rejected', async () => {
    request.mockResolvedValue({ ok: false, status: 422, data: { errors: { instagram: ['must be valid'] } } });
    const error = await repository.updateByUsername('ana', { name: 'Ana' }).catch((caught: AppError) => caught);
    expect(error).toEqual(new AppError('Confira os campos destacados.', 422));
    expect((error as AppError).fields).toEqual({ instagram: ['must be valid'] });
  });

  it('maps other write failures', async () => {
    request.mockResolvedValue({ ok: false, status: 500, data: {} });
    await expect(repository.create({ name: 'Ana' })).rejects.toEqual(
      new AppError('Não foi possível salvar o perfil de atleta.', 500)
    );
    request.mockRejectedValue(new TypeError('offline'));
    await expect(repository.create({ name: 'Ana' })).rejects.toEqual(
      new AppError('Não foi possível salvar o perfil de atleta.')
    );
  });
});
