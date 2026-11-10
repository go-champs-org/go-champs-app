import { AccountRepository, DeleteAccountError } from '../../repositories/AccountRepository';
import { DeleteAccountUseCase } from '../DeleteAccountUseCase';

describe('DeleteAccountUseCase', () => {
  it('sends the password to the account repository', async () => {
    const deleteAccount = jest.fn().mockResolvedValue(undefined);
    const useCase = new DeleteAccountUseCase({ deleteAccount } as unknown as AccountRepository);

    await expect(useCase.execute('secret')).resolves.toBeUndefined();
    expect(deleteAccount).toHaveBeenCalledWith('secret');
  });

  it('passes the typed failure through', async () => {
    const failure = new DeleteAccountError('invalid_password', 'Senha incorreta.', 401);
    const useCase = new DeleteAccountUseCase({
      deleteAccount: jest.fn().mockRejectedValue(failure),
    } as unknown as AccountRepository);

    await expect(useCase.execute('wrong')).rejects.toBe(failure);
  });
});
