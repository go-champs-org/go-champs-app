import { AccountRepository, AuthenticatedUser, SignInCredentials } from '../repositories/AccountRepository';

export class SignInUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  execute(credentials: SignInCredentials): Promise<AuthenticatedUser> {
    return this.accountRepository.signIn(credentials);
  }
}
