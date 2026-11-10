import { AccountRepository } from '../repositories/AccountRepository';

/** Permanently deletes the signed-in account (GC-389). */
export class DeleteAccountUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  execute(password: string): Promise<void> {
    return this.accountRepository.deleteAccount(password);
  }
}
