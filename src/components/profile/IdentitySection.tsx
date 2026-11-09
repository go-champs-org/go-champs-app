import React from 'react';
import {
  EmptyProfileCard,
  ProfileCard,
  ProfileField,
  ProfileRow,
  ProfileSection,
  RowDivider,
  SectionActions,
} from './ProfileSection';
import type { useAccountViewModel } from '../../viewmodels/AccountViewModel';
import { maskBirthDate, maskCpf, maskedDocument } from '../../domain/usecases/shared/accountIdentityForm';

type AccountModel = ReturnType<typeof useAccountViewModel>;

export const IdentitySection = ({ identity }: { identity: AccountModel['identity'] }) => {
  const { data, editing, values, fieldErrors } = identity;
  const footnote = 'Seus dados de identidade não aparecem no seu perfil.';

  if (editing) {
    return (
      <ProfileSection title="Dados de identidade" isPrivate footnote={footnote}>
        <ProfileCard>
          <ProfileField
            label="Nome completo"
            value={values.fullLegalName}
            onChangeText={(value) => identity.setField('fullLegalName', value)}
            placeholder="Como no documento"
            autoCapitalize="words"
            editable={!identity.saving}
            error={fieldErrors.fullLegalName}
          />
          <ProfileField
            label="CPF"
            value={maskCpf(values.taxId)}
            onChangeText={(value) => identity.setField('taxId', value.replace(/\D/g, ''))}
            placeholder="000.000.000-00"
            hint={data?.tax_id_last4 ? `Termina em ${data.tax_id_last4}. Deixe em branco para manter.` : undefined}
            keyboardType="number-pad"
            maxLength={14}
            editable={!identity.saving}
            error={fieldErrors.taxId}
          />
          <ProfileField
            label="RG"
            value={values.governmentId}
            onChangeText={(value) => identity.setField('governmentId', value)}
            placeholder="Número do RG"
            hint={
              data?.government_id_last4
                ? `Termina em ${data.government_id_last4}. Deixe em branco para manter.`
                : undefined
            }
            autoCapitalize="characters"
            editable={!identity.saving}
            error={fieldErrors.governmentId}
          />
          <ProfileField
            label="Data de nascimento"
            value={values.dateOfBirth}
            onChangeText={(value) => identity.setField('dateOfBirth', maskBirthDate(value))}
            placeholder="DD/MM/AAAA"
            keyboardType="number-pad"
            maxLength={10}
            editable={!identity.saving}
            error={fieldErrors.dateOfBirth}
          />
          <SectionActions
            saving={identity.saving}
            error={identity.error}
            onCancel={identity.cancelEdit}
            onSave={() => void identity.save()}
          />
        </ProfileCard>
      </ProfileSection>
    );
  }

  if (!identity.hasData || !data) {
    return (
      <ProfileSection title="Dados de identidade" isPrivate footnote={footnote}>
        <EmptyProfileCard
          title="Nenhum dado de identidade ainda"
          description="Adicione seu nome completo, CPF, RG e data de nascimento."
          actionLabel="Adicionar dados de identidade"
          onAction={identity.startEdit}
        />
      </ProfileSection>
    );
  }

  return (
    <ProfileSection
      title="Dados de identidade"
      isPrivate
      onEdit={identity.startEdit}
      editLabel="Editar dados de identidade"
      footnote={footnote}
    >
      <ProfileCard>
        <ProfileRow label="Nome completo" value={data.full_legal_name} />
        <RowDivider />
        <ProfileRow label="CPF" value={maskedDocument(data.tax_id_last4)} />
        <RowDivider />
        <ProfileRow label="RG" value={maskedDocument(data.government_id_last4)} />
        <RowDivider />
        <ProfileRow label="Data de nascimento" value={formatLongDate(data.date_of_birth)} />
      </ProfileCard>
    </ProfileSection>
  );
};

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "1997-05-21" -> "21 mai 1997", as the mockup shows it. */
const formatLongDate = (iso: string | null) => {
  const match = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${Number(match[3])} ${MONTHS[Number(match[2]) - 1]} ${match[1]}` : null;
};

