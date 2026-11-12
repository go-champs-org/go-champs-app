import { RegistrationInvite, RegistrationRepository } from '../../repositories/RegistrationRepository';
import { GetRegistrationInviteUseCase } from '../GetRegistrationInviteUseCase';
import { RespondToRegistrationInviteUseCase } from '../RespondToRegistrationInviteUseCase';

const invite: RegistrationInvite = {
  id: 'invite-1',
  teamName: 'Goiás',
  tournamentName: 'CBSE Sub 16',
  registration: {
    title: 'Inscrições',
    startDate: null,
    endDate: null,
    autoApprove: false,
    customFields: [
      { id: 'terms', type: 'consent', label: 'Termo', description: null, required: true, documentUrl: null },
    ],
  },
};

const repositoryWith = (overrides: Partial<RegistrationRepository>): RegistrationRepository => ({
  getInvite: jest.fn(),
  respondToInvite: jest.fn(),
  ...overrides,
});

describe('GetRegistrationInviteUseCase', () => {
  it('loads the invite', async () => {
    const repository = repositoryWith({ getInvite: jest.fn().mockResolvedValue(invite) });

    await expect(new GetRegistrationInviteUseCase(repository).execute('invite-1')).resolves.toBe(invite);
    expect(repository.getInvite).toHaveBeenCalledWith('invite-1');
  });
});

describe('RespondToRegistrationInviteUseCase', () => {
  it('sends a valid form as the response', async () => {
    const respondToInvite = jest.fn().mockResolvedValue({ id: 'r1', status: 'pending' });
    const useCase = new RespondToRegistrationInviteUseCase(repositoryWith({ respondToInvite }));

    await expect(
      useCase.execute(invite, { name: 'Ana Silva', shirtNumber: '7', custom: { terms: true } })
    ).resolves.toEqual({ kind: 'submitted', response: { id: 'r1', status: 'pending' } });
    expect(respondToInvite).toHaveBeenCalledWith('invite-1', { name: 'Ana Silva', shirt_number: '7', terms: true });
  });

  it('sends nothing while a field is invalid', async () => {
    const respondToInvite = jest.fn();
    const useCase = new RespondToRegistrationInviteUseCase(repositoryWith({ respondToInvite }));

    await expect(useCase.execute(invite, { name: 'Ana', shirtNumber: '', custom: {} })).resolves.toEqual({
      kind: 'invalid',
      fieldErrors: { name: 'Informe nome e sobrenome.', terms: 'Aceite o documento para continuar.' },
    });
    expect(respondToInvite).not.toHaveBeenCalled();
  });
});
