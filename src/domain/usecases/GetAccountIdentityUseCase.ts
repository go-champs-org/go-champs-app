import { AccountIdentity, AccountIdentityRepository } from '../repositories/AccountIdentityRepository';

export class GetAccountIdentityUseCase {
  constructor(private readonly accountIdentityRepository: AccountIdentityRepository) {}

  execute(): Promise<AccountIdentity | null> {
    return this.accountIdentityRepository.get();
  }
}
