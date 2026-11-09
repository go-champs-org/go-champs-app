import { AccountIdentity, AccountIdentityRepository } from '../repositories/AccountIdentityRepository';
import { buildIdentityWrite, IdentityFormValues } from './shared/accountIdentityForm';

export class SaveAccountIdentityUseCase {
  constructor(private readonly accountIdentityRepository: AccountIdentityRepository) {}

  /**
   * One request for the whole section: PUT when the account already has an
   * identity, POST otherwise. Nothing changed means nothing is sent.
   */
  async execute(values: IdentityFormValues, original: AccountIdentity | null): Promise<AccountIdentity | null> {
    const write = buildIdentityWrite(values, original);
    if (Object.keys(write).length === 0) return original;
    return original
      ? this.accountIdentityRepository.update(write)
      : this.accountIdentityRepository.create(write);
  }
}
