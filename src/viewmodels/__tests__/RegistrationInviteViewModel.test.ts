import { act, renderHook, waitFor } from '@testing-library/react-native';
import { container } from '../../di/container';
import { AuthenticatedUser } from '../../domain/repositories/AccountRepository';
import { RegistrationInvite, RegistrationResponseError } from '../../domain/repositories/RegistrationRepository';
import { useRegistrationInviteViewModel } from '../RegistrationInviteViewModel';

jest.mock('../../di/container', () => ({
  container: {
    getRegistrationInvite: { execute: jest.fn() },
    getAthleteProfileByUsername: { execute: jest.fn() },
    respondToRegistrationInvite: { execute: jest.fn() },
  },
}));

const getInvite = container.getRegistrationInvite.execute as jest.Mock;
const getProfile = container.getAthleteProfileByUsername.execute as jest.Mock;
const respond = container.respondToRegistrationInvite.execute as jest.Mock;

const user: AuthenticatedUser = { username: 'ana', email: 'ana@example.com', token: 'tok' };

const invite: RegistrationInvite = {
  id: 'invite-1',
  team: { name: 'Goiás', logoUrl: null },
  tournament: { name: 'CBSE Sub 16', logoUrl: null },
  organization: { name: 'CBB', logoUrl: null },
  registration: {
    title: 'Inscrições',
    startDate: null,
    endDate: null,
    autoApprove: false,
    customFields: [
      { id: 'terms', type: 'consent', label: 'Termo', description: null, required: true, documentUrl: 'https://cdn/t.pdf' },
      { id: 'position', type: 'text', label: 'Posição', description: null, required: false, documentUrl: null },
    ],
  },
};

type Props = { id: string; signedIn: AuthenticatedUser | null };

const render = (currentUser: AuthenticatedUser | null = user, inviteId = 'invite-1') =>
  renderHook<ReturnType<typeof useRegistrationInviteViewModel>, Props>(
    ({ id, signedIn }) => useRegistrationInviteViewModel(id, signedIn),
    { initialProps: { id: inviteId, signedIn: currentUser } }
  );

describe('useRegistrationInviteViewModel', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    getInvite.mockResolvedValue(invite);
    getProfile.mockResolvedValue({ name: 'Ana Silva' });
  });

  it('loads the invite and fills the name and e-mail from the account', async () => {
    const { result } = render();

    expect(result.current.loading).toBe(true);
    expect(result.current.profileLoading).toBe(true);
    await waitFor(() => expect(result.current.invite).toBe(invite));
    await waitFor(() => expect(result.current.values.name).toBe('Ana Silva'));

    expect(result.current.loading).toBe(false);
    expect(result.current.profileLoading).toBe(false);
    expect(result.current.window).toBe('open');
    expect(result.current.email).toBe('ana@example.com');
    expect(getInvite).toHaveBeenCalledWith('invite-1');
    expect(getProfile).toHaveBeenCalledWith('ana');
  });

  it('keeps the name blank without an athlete profile, or when it fails to load', async () => {
    getProfile.mockResolvedValueOnce(null);
    const first = render();
    await waitFor(() => expect(first.result.current.profileLoading).toBe(false));
    expect(first.result.current.values.name).toBe('');

    getProfile.mockRejectedValueOnce(new Error('offline'));
    const second = render();
    await waitFor(() => expect(second.result.current.profileLoading).toBe(false));
    expect(second.result.current.values.name).toBe('');
  });

  it('shows the invite without a session and fills the name once the athlete signs in', async () => {
    const { result, rerender } = render(null);

    await waitFor(() => expect(result.current.invite).toBe(invite));
    expect(result.current.email).toBeNull();
    expect(result.current.profileLoading).toBe(false);
    expect(getProfile).not.toHaveBeenCalled();

    rerender({ id: 'invite-1', signedIn: user });
    await waitFor(() => expect(result.current.values.name).toBe('Ana Silva'));
  });

  it('keeps what the athlete typed over the profile name', async () => {
    const { result } = render();
    await waitFor(() => expect(result.current.values.name).toBe('Ana Silva'));

    act(() => result.current.setName('Ana Maria Silva'));
    act(() => result.current.setShirtNumber('7'));
    act(() => result.current.setCustomValue('position', 'Ala'));

    expect(result.current.values).toEqual({
      name: 'Ana Maria Silva',
      shirtNumber: '7',
      custom: { position: 'Ala' },
    });
  });

  it('shows an error when the invite fails to load and loads again on retry', async () => {
    getInvite.mockRejectedValueOnce(new Error('offline'));
    const { result } = render();

    await waitFor(() => expect(result.current.error).toBe('Não foi possível carregar o convite. Tente novamente.'));
    act(() => result.current.retry());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.invite).toBe(invite));
    expect(getInvite).toHaveBeenCalledTimes(2);
  });

  it('reads a missing invite as not found', async () => {
    getInvite.mockResolvedValueOnce(null);
    const { result } = render();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.invite).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('ignores answers that arrive after unmount', async () => {
    let resolveInvite: (value: RegistrationInvite) => void = () => undefined;
    let rejectProfile: (error: Error) => void = () => undefined;
    getInvite.mockReturnValueOnce(new Promise((done) => (resolveInvite = done)));
    getProfile.mockReturnValueOnce(new Promise((_, fail) => (rejectProfile = fail)));
    const { result, unmount } = render();

    unmount();
    await act(async () => {
      resolveInvite(invite);
      rejectProfile(new Error('late'));
    });
    expect(result.current.loading).toBe(true);
  });

  it('ignores a failed load that arrives after unmount', async () => {
    let rejectInvite: (error: Error) => void = () => undefined;
    let resolveProfile: (value: { name: string }) => void = () => undefined;
    getInvite.mockReturnValueOnce(new Promise((_, fail) => (rejectInvite = fail)));
    getProfile.mockReturnValueOnce(new Promise((done) => (resolveProfile = done)));
    const { result, unmount } = render();

    unmount();
    await act(async () => {
      rejectInvite(new Error('late'));
      resolveProfile({ name: 'Late' });
    });
    expect(result.current.error).toBeNull();
  });

  it('remembers which documents the athlete opened', async () => {
    const { result } = render();
    await waitFor(() => expect(result.current.invite).toBe(invite));

    expect(result.current.documentOpened('terms')).toBe(false);
    act(() => result.current.markDocumentOpened('terms'));
    expect(result.current.documentOpened('terms')).toBe(true);
  });

  it('shows the field errors and clears each one as it is fixed', async () => {
    respond.mockResolvedValueOnce({
      kind: 'invalid',
      fieldErrors: { name: 'Informe nome e sobrenome.', terms: 'Aceite o documento para continuar.' },
    });
    const { result } = render();
    await waitFor(() => expect(result.current.values.name).toBe('Ana Silva'));

    await act(() => result.current.submit());
    expect(result.current.fieldErrors).toEqual({
      name: 'Informe nome e sobrenome.',
      terms: 'Aceite o documento para continuar.',
    });

    act(() => result.current.setName('Ana Silva Souza'));
    act(() => result.current.setCustomValue('terms', true));
    act(() => result.current.setCustomValue('position', 'Ala'));
    expect(result.current.fieldErrors).toEqual({});
    expect(result.current.submitted).toBeNull();
  });

  it('sends the response and tells a pending one apart from an approved one', async () => {
    respond.mockResolvedValueOnce({ kind: 'submitted', response: { id: 'r1', status: 'pending' } });
    const { result } = render();
    await waitFor(() => expect(result.current.values.name).toBe('Ana Silva'));
    act(() => result.current.setCustomValue('terms', true));

    await act(() => result.current.submit());

    expect(respond).toHaveBeenCalledWith(invite, { name: 'Ana Silva', shirtNumber: '', custom: { terms: true } });
    expect(result.current.submitted).toEqual({ id: 'r1', status: 'pending' });
    expect(result.current.approved).toBe(false);
    expect(result.current.submitting).toBe(false);
  });

  it.each([
    [{ status: 'approved' }, false],
    [{ status: 'pending' }, true],
  ])('reads %p as approved when the registration approves on its own: %p', async (response, autoApprove) => {
    getInvite.mockResolvedValue({ ...invite, registration: { ...invite.registration, autoApprove } });
    respond.mockResolvedValueOnce({ kind: 'submitted', response: { id: 'r1', ...response } });
    const { result } = render();
    await waitFor(() => expect(result.current.invite).not.toBeNull());

    await act(() => result.current.submit());
    expect(result.current.approved).toBe(true);
  });

  it('shows why the API refused the response', async () => {
    respond.mockRejectedValueOnce(
      new RegistrationResponseError('already_answered', 'Você já se inscreveu neste time.', 422)
    );
    const { result } = render();
    await waitFor(() => expect(result.current.invite).toBe(invite));

    await act(() => result.current.submit());
    expect(result.current.submitError).toBe('Você já se inscreveu neste time.');
    expect(result.current.submitted).toBeNull();

    respond.mockRejectedValueOnce(new Error('boom'));
    await act(() => result.current.submit());
    expect(result.current.submitError).toBe('Não foi possível enviar sua inscrição. Tente novamente.');
  });

  it('sends nothing without a session, before the invite loads, or outside the registration window', async () => {
    getInvite.mockResolvedValueOnce({
      ...invite,
      registration: { ...invite.registration, endDate: '2000-01-01T00:00:00Z' },
    });
    const closed = render();
    await act(() => closed.result.current.submit());
    await waitFor(() => expect(closed.result.current.window).toBe('ended'));
    await act(() => closed.result.current.submit());

    const signedOut = render(null);
    await waitFor(() => expect(signedOut.result.current.invite).toBe(invite));
    await act(() => signedOut.result.current.submit());

    expect(respond).not.toHaveBeenCalled();
  });
});
