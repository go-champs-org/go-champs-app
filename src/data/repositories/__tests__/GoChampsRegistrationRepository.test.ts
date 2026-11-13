import { HttpClient } from '../../../core/http/HttpClient';
import { RegistrationResponseError } from '../../../domain/repositories/RegistrationRepository';
import { GoChampsApiClient } from '../../datasources/remote/GoChampsApiClient';
import { GoChampsRegistrationRepository } from '../GoChampsRegistrationRepository';

const request = jest.fn();
const httpClient = { request } as unknown as HttpClient;
const repository = new GoChampsRegistrationRepository(new GoChampsApiClient(httpClient, { getToken: () => 'tok' }));

const apiInvite = {
  id: 'invite-1',
  invitee: { name: 'Goiás', logo_url: 'https://cdn/goias.png', players: [] },
  registration: {
    title: 'Inscrições 2026',
    start_date: '2026-11-01T00:00:00Z',
    end_date: '2026-11-30T00:00:00Z',
    auto_approve: true,
    tournament: {
      name: 'CBSE Sub 16',
      logo_url: null,
      organization: { name: 'CBB', logo_url: 'https://cdn/cbb.png' },
    },
    custom_fields: [
      { id: 'f-text', type: 'text', label: 'Posição', description: 'Ala, pivô...', required: true, properties: {} },
      { id: 'f-date', type: 'Date', label: 'Nascimento', description: null, required: false, properties: null },
      { id: 'f-dt', type: 'datetime', label: 'Chegada', required: null },
      {
        id: 'f-consent',
        type: 'consent',
        label: 'Termo',
        description: '',
        required: true,
        properties: { public_url: 'https://cdn/termo.pdf' },
      },
      { id: 'f-file', type: 'file', label: 'Foto', required: true },
    ],
  },
};

const rejectWith = (status: number, errors?: Record<string, unknown>) =>
  request.mockResolvedValue({ ok: false, status, data: errors ? { errors } : null });

const failureOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error as RegistrationResponseError;
  }
  throw new Error('expected a rejection');
};

describe('GoChampsRegistrationRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getInvite', () => {
    it('loads the invite with its registration and tournament', async () => {
      request.mockResolvedValue({ ok: true, status: 200, data: { data: apiInvite } });

      await expect(repository.getInvite('invite-1')).resolves.toEqual({
        id: 'invite-1',
        team: { name: 'Goiás', logoUrl: 'https://cdn/goias.png' },
        tournament: { name: 'CBSE Sub 16', logoUrl: null },
        organization: { name: 'CBB', logoUrl: 'https://cdn/cbb.png' },
        registration: {
          title: 'Inscrições 2026',
          startDate: '2026-11-01T00:00:00Z',
          endDate: '2026-11-30T00:00:00Z',
          autoApprove: true,
          customFields: [
            { id: 'f-text', type: 'text', label: 'Posição', description: 'Ala, pivô...', required: true, documentUrl: null },
            { id: 'f-date', type: 'date', label: 'Nascimento', description: null, required: false, documentUrl: null },
            { id: 'f-dt', type: 'datetime', label: 'Chegada', description: null, required: false, documentUrl: null },
            {
              id: 'f-consent',
              type: 'consent',
              label: 'Termo',
              description: null,
              required: true,
              documentUrl: 'https://cdn/termo.pdf',
            },
          ],
        },
      });
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint:
            'https://api.go-champs.com/v1/registration-invites/invite-1?include=registration,registration.tournament,registration.tournament.organization',
          method: 'GET',
        })
      );
    });

    it('reads an invite without its registration', async () => {
      request.mockResolvedValue({ ok: true, status: 200, data: { data: { id: 'invite-1' } } });

      await expect(repository.getInvite('invite-1')).resolves.toEqual({
        id: 'invite-1',
        team: null,
        tournament: null,
        organization: null,
        registration: { title: '', startDate: null, endDate: null, autoApprove: false, customFields: [] },
      });
    });

    it('returns null when the invite does not exist', async () => {
      rejectWith(404, { detail: 'Not Found' });
      await expect(repository.getInvite('missing')).resolves.toBeNull();
    });

    it('lets any other failure through', async () => {
      rejectWith(500);
      await expect(repository.getInvite('invite-1')).rejects.toMatchObject({ status: 500 });
    });
  });

  describe('respondToInvite', () => {
    it('answers the invite as the signed-in user', async () => {
      request.mockResolvedValue({
        ok: true,
        status: 201,
        data: { data: { id: 'response-1', status: 'pending', response: {} } },
      });

      await expect(repository.respondToInvite('invite-1', { name: 'Ana Silva', 'f-consent': true })).resolves.toEqual({
        id: 'response-1',
        status: 'pending',
      });
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: 'https://api.go-champs.com/v1/registration-invites/invite-1/responses',
          method: 'POST',
          headers: expect.objectContaining({ authorization: 'Bearer tok' }),
          body: { registration_response: { response: { name: 'Ana Silva', 'f-consent': true } } },
        })
      );
    });

    it.each([
      [{ response: ['email already exists'] }, 'already_answered', 'Você já se inscreveu neste time.'],
      [
        { registration_invite_id: ['registration is not active yet'] },
        'closed',
        'As inscrições para este time ainda não abriram.',
      ],
      [
        { registration_invite_id: ['registration is not active anymore'] },
        'closed',
        'As inscrições para este time foram encerradas.',
      ],
      [{ registration_invite_id: ['does not exist'] }, 'unavailable', 'Este convite não está mais disponível.'],
      [{ response: ['missing required fields'] }, 'invalid', 'Confira os campos obrigatórios.'],
      [{}, 'invalid', 'Confira os campos obrigatórios.'],
    ])('explains the API error %p', async (errors, reason, message) => {
      rejectWith(422, errors);

      const failure = await failureOf(repository.respondToInvite('invite-1', { name: 'Ana Silva' }));

      expect(failure).toBeInstanceOf(RegistrationResponseError);
      expect(failure).toMatchObject({ reason, message, status: 422 });
    });

    it.each([
      [401, 'session_expired', 'Sessão expirada. Entre novamente para enviar sua inscrição.'],
      [403, 'session_expired', 'Sessão expirada. Entre novamente para enviar sua inscrição.'],
      [404, 'unavailable', 'Este convite não está mais disponível.'],
      [500, 'failed', 'Não foi possível enviar sua inscrição. Tente novamente.'],
    ])('explains an HTTP %i', async (status, reason, message) => {
      rejectWith(status);

      await expect(repository.respondToInvite('invite-1', { name: 'Ana Silva' })).rejects.toMatchObject({
        reason,
        message,
        status,
      });
    });

    it('explains a network failure', async () => {
      request.mockRejectedValue(new TypeError('Network request failed'));

      await expect(repository.respondToInvite('invite-1', { name: 'Ana Silva' })).rejects.toMatchObject({
        reason: 'failed',
        message: 'Não foi possível enviar sua inscrição. Tente novamente.',
      });
    });
  });
});
