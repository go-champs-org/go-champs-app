import { AccountRepository, UserAccountProfile } from '../repositories/AccountRepository';

export class GetAccountProfileUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  execute(username: string): Promise<UserAccountProfile> {
    return this.accountRepository.getAccountProfile(username);
  }
}
