import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppError } from '../../core/errors/AppError';
import { container } from '../../di/container';
import { OrganizationOverview } from '../../domain/usecases/GetOrganizationOverviewUseCase';
import { useOrganizationViewModel } from '../OrganizationViewModel';

jest.mock('../../di/container', () => ({
  container: { getOrganizationOverview: { execute: jest.fn() } },
}));

const getOrganization = container.getOrganizationOverview.execute as jest.Mock;

const overview: OrganizationOverview = {
  organization: { id: 'org-1', name: 'NLBB', slug: 'nlbb', logoUrl: null },
  tournaments: [{ id: 't1', name: 'Taça Bauru', logoUrl: null }],
};

describe('useOrganizationViewModel', () => {
  beforeEach(() => getOrganization.mockReset());

  it('loads the organization overview', async () => {
    getOrganization.mockResolvedValue(overview);
    const { result } = renderHook(() => useOrganizationViewModel('nlbb', 'https://api.test'));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getOrganization).toHaveBeenCalledWith('nlbb', 'https://api.test');
    expect(result.current.overview).toEqual(overview);
    expect(result.current.error).toBeNull();
  });

  it('shows the not found message of a missing organization', async () => {
    getOrganization.mockRejectedValue(new AppError('Organização não encontrada.', 404));
    const { result } = renderHook(() => useOrganizationViewModel('missing'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.overview).toBeNull();
    expect(result.current.error).toBe('Organização não encontrada.');
  });

  it('shows a generic message on other failures and loads again on retry', async () => {
    getOrganization.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(overview);
    const { result } = renderHook(() => useOrganizationViewModel('nlbb'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Não foi possível abrir a organização. Tente novamente.');

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.overview).toEqual(overview));
    expect(getOrganization).toHaveBeenCalledTimes(2);
  });

  it('ignores an answer that arrives after unmount', async () => {
    let resolve: (value: OrganizationOverview) => void = () => undefined;
    getOrganization.mockReturnValue(new Promise((done) => (resolve = done)));
    const { result, unmount } = renderHook(() => useOrganizationViewModel('nlbb'));

    unmount();
    await act(async () => resolve(overview));
    expect(result.current.overview).toBeNull();
  });

  it('ignores a failure that arrives after unmount', async () => {
    let reject: (reason: Error) => void = () => undefined;
    getOrganization.mockReturnValue(new Promise((_, fail) => (reject = fail)));
    const { result, unmount } = renderHook(() => useOrganizationViewModel('nlbb'));

    unmount();
    await act(async () => reject(new Error('offline')));
    expect(result.current.error).toBeNull();
  });
});

describe('useOrganizationViewModel refresh', () => {
  beforeEach(() => getOrganization.mockReset());

  it('refreshes behind the organization on screen', async () => {
    getOrganization.mockResolvedValue(overview);
    const { result } = renderHook(() => useOrganizationViewModel('nlbb'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const updated = { ...overview, tournaments: [...overview.tournaments, { id: 't2', name: 'Liga', logoUrl: null }] };
    getOrganization.mockResolvedValueOnce(updated);

    act(() => result.current.refresh());
    expect(result.current.refreshing).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.overview).toEqual(overview);
    await waitFor(() => expect(result.current.refreshing).toBe(false));
    expect(result.current.overview).toEqual(updated);
    expect(result.current.refreshError).toBeNull();
  });

  it('keeps the organization when a refresh fails', async () => {
    getOrganization.mockResolvedValue(overview);
    const { result } = renderHook(() => useOrganizationViewModel('nlbb'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    getOrganization.mockRejectedValueOnce(new Error('offline'));

    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.refreshing).toBe(false));
    expect(result.current.overview).toEqual(overview);
    expect(result.current.error).toBeNull();
    expect(result.current.refreshError).toBe('Não foi possível atualizar. Puxe a tela para tentar novamente.');
  });
});
