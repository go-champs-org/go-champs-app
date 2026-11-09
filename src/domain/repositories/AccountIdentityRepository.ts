export type TaxIdType = 'CPF';
export type GovernmentIdType = 'RG';

/** Private identity of the signed-in account. Documents come back masked (last 4 only). */
export type AccountIdentity = {
  id: string;
  full_legal_name: string | null;
  tax_id_type: TaxIdType | null;
  tax_id_last4: string | null;
  government_id_type: GovernmentIdType | null;
  government_id_last4: string | null;
  /** ISO date, YYYY-MM-DD. */
  date_of_birth: string | null;
};

/**
 * Only the keys present are written: an absent key is left as is, a null one
 * is cleared (same contract the CMS uses).
 */
export type AccountIdentityWrite = {
  full_legal_name?: string | null;
  tax_id_type?: TaxIdType | null;
  tax_id?: string | null;
  government_id_type?: GovernmentIdType | null;
  government_id?: string | null;
  date_of_birth?: string | null;
};

export interface AccountIdentityRepository {
  get(): Promise<AccountIdentity | null>;
  create(input: AccountIdentityWrite): Promise<AccountIdentity>;
  update(input: AccountIdentityWrite): Promise<AccountIdentity>;
}
