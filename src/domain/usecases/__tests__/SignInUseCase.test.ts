import { AccountRepository } from '../../repositories/AccountRepository';
import { SignInUseCase } from '../SignInUseCase';

describe('SignInUseCase', () => {
  it('delegates credentials to the account repository', async () => {
    const signIn = jest.fn().mockResolvedValue({ email: 'ana@example.com', token: 'token', username: 'ana' });
    const useCase = new SignInUseCase({ signIn } as unknown as AccountRepository);

    await expect(useCase.execute({ username: 'ana', password: 'secret' })).resolves.toMatchObject({ username: 'ana' });
    expect(signIn).toHaveBeenCalledWith({ username: 'ana', password: 'secret' });
  });
});
