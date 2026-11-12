import { useCallback, useEffect, useState } from 'react';
import { container } from '../di/container';
import { AuthenticatedUser } from '../domain/repositories/AccountRepository';
import {
  RegistrationInvite,
  RegistrationResponseError,
  SubmittedRegistrationResponse,
} from '../domain/repositories/RegistrationRepository';
import {
  RegistrationFieldErrors,
  RegistrationFormValues,
  registrationWindow,
} from '../domain/usecases/shared/registrationForm';

const LOAD_ERROR = 'Não foi possível carregar o convite. Tente novamente.';
const SEND_ERROR = 'Não foi possível enviar sua inscrição. Tente novamente.';

type InviteOutcome = { key: string; invite: RegistrationInvite | null; error: string | null };
type ProfileName = { username: string; name: string | null };

/**
 * A team roster invite opened in the app (go-champs.com/Invite/:id). The
 * signed-in athlete answers it with the name of their athlete profile and the
 * e-mail of their account; the API ties the response to the account.
 */
export const useRegistrationInviteViewModel = (inviteId: string, user: AuthenticatedUser | null) => {
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<InviteOutcome | null>(null);
  // Each attempt at each invite is its own load; an earlier one reads as loading.
  const key = `${attempt}|${inviteId}`;

  useEffect(() => {
    let mounted = true;
    container.getRegistrationInvite
      .execute(inviteId)
      .then((invite) => {
        if (mounted) setOutcome({ key, invite, error: null });
      })
      .catch(() => {
        if (mounted) setOutcome({ key, invite: null, error: LOAD_ERROR });
      });
    return () => {
      mounted = false;
    };
  }, [inviteId, key]);

  const current = outcome?.key === key ? outcome : null;
  const invite = current?.invite ?? null;

  // The athlete profile's name fills the form; without one it starts blank.
  const username = user?.username ?? null;
  const [profile, setProfile] = useState<ProfileName | null>(null);

  useEffect(() => {
    if (!username) return;
    let mounted = true;
    container.getAthleteProfileByUsername
      .execute(username)
      .then((athleteProfile) => {
        if (mounted) setProfile({ username, name: athleteProfile?.name ?? null });
      })
      .catch(() => {
        if (mounted) setProfile({ username, name: null });
      });
    return () => {
      mounted = false;
    };
  }, [username]);

  const profileLoading = !!username && profile?.username !== username;
  const profileName = profile?.username === username ? profile.name : null;

  // null until the athlete types: the profile's name shows meanwhile.
  const [typedName, setTypedName] = useState<string | null>(null);
  const [shirtNumber, setShirtNumberValue] = useState('');
  const [custom, setCustom] = useState<Record<string, string | boolean>>({});
  const [openedDocuments, setOpenedDocuments] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<RegistrationFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SubmittedRegistrationResponse | null>(null);

  const values: RegistrationFormValues = { name: typedName ?? profileName ?? '', shirtNumber, custom };

  const clearError = (field: string) =>
    setFieldErrors((errors) => {
      if (!(field in errors)) return errors;
      const { [field]: _cleared, ...rest } = errors;
      return rest;
    });

  const setName = (name: string) => {
    setTypedName(name);
    clearError('name');
  };

  const setShirtNumber = (value: string) => setShirtNumberValue(value);

  const setCustomValue = (fieldId: string, value: string | boolean) => {
    setCustom((answers) => ({ ...answers, [fieldId]: value }));
    clearError(fieldId);
  };

  const markDocumentOpened = (fieldId: string) =>
    setOpenedDocuments((opened) => ({ ...opened, [fieldId]: true }));

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  const window = invite ? registrationWindow(invite.registration) : 'open';

  const submit = async () => {
    if (!invite || !user || submitting || window !== 'open') return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await container.respondToRegistrationInvite.execute(invite, values);
      if (result.kind === 'invalid') setFieldErrors(result.fieldErrors);
      else setSubmitted(result.response);
    } catch (error) {
      setSubmitError(error instanceof RegistrationResponseError ? error.message : SEND_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    loading: !current,
    error: current?.error ?? null,
    retry,
    invite,
    window,
    email: user?.email ?? null,
    profileLoading,
    values,
    setName,
    setShirtNumber,
    setCustomValue,
    documentOpened: (fieldId: string) => !!openedDocuments[fieldId],
    markDocumentOpened,
    fieldErrors,
    submitting,
    submitError,
    submitted,
    // The API approves an auto-approve registration's responses right after
    // they arrive, so the athlete is told it is approved.
    approved: !!submitted && (submitted.status === 'approved' || !!invite?.registration.autoApprove),
    submit,
  };
};
