import { act, renderHook, waitFor } from '@testing-library/react-native';
import { container } from '../../di/container';
import { ResolvedGoChampsLink } from '../../domain/usecases/ResolveGoChampsLinkUseCase';
import { useGoChampsLinkViewModel } from '../GoChampsLinkViewModel';

jest.mock('../../di/container', () => ({
  container: { resolveGoChampsLink: { execute: jest.fn() } },
}));

const resolveLink = container.resolveGoChampsLink.execute as jest.Mock;
const team: ResolvedGoChampsLink = { kind: 'team', tournamentId: 't1', teamId: 'team-1' };

describe('useGoChampsLinkViewModel', () => {
  beforeEach(() => resolveLink.mockReset());

  it('resolves the link', async () => {
    resolveLink.mockResolvedValue(team);
    const { result } = renderHook(() => useGoChampsLinkViewModel('/acme/liga/team/team-1'));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.resolved).toEqual(team));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(resolveLink).toHaveBeenCalledWith('/acme/liga/team/team-1');
  });

  it('shows an error when the lookup fails and resolves again on retry', async () => {
    resolveLink.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(team);
    const { result } = renderHook(() => useGoChampsLinkViewModel('/acme/liga/team/team-1'));

    await waitFor(() => expect(result.current.error).toBe('Não foi possível abrir o link. Tente novamente.'));
    expect(result.current.loading).toBe(false);

    act(() => result.current.retry());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.resolved).toEqual(team));
    expect(resolveLink).toHaveBeenCalledTimes(2);
  });

  it('ignores an answer that arrives after unmount', async () => {
    let resolve: (value: ResolvedGoChampsLink) => void = () => undefined;
    resolveLink.mockReturnValue(new Promise((done) => (resolve = done)));
    const { result, unmount } = renderHook(() => useGoChampsLinkViewModel('/acme/liga'));

    unmount();
    await act(async () => resolve(team));
    expect(result.current.resolved).toBeNull();
  });

  it('ignores a failure that arrives after unmount', async () => {
    let reject: (reason: Error) => void = () => undefined;
    resolveLink.mockReturnValue(new Promise((_, fail) => (reject = fail)));
    const { result, unmount } = renderHook(() => useGoChampsLinkViewModel('/acme/liga'));

    unmount();
    await act(async () => reject(new Error('offline')));
    expect(result.current.error).toBeNull();
  });
});
