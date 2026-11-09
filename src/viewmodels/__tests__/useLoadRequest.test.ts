import { act, renderHook } from '@testing-library/react-native';
import { REFRESH_ERROR, useLoadRequest } from '../useLoadRequest';

describe('useLoadRequest', () => {
  it('starts with a full load and tells a refresh from a retry', () => {
    const { result } = renderHook(() => useLoadRequest<{ phaseId: string }>('t1'));
    expect(result.current.request).toEqual({ key: 't1', id: 0, refresh: false });
    expect(result.current.refreshing).toBe(false);

    act(() => result.current.refresh({ phaseId: 'p1' }));
    expect(result.current.request).toEqual({ key: 't1', id: 1, refresh: true, context: { phaseId: 'p1' } });
    expect(result.current.refreshing).toBe(true);

    act(() => result.current.settleRefresh(true));
    expect(result.current.refreshing).toBe(false);
    expect(result.current.refreshError).toBe(REFRESH_ERROR);

    act(() => result.current.retry());
    expect(result.current.request).toEqual({ key: 't1', id: 2, refresh: false });
    expect(result.current.refreshError).toBeNull();

    act(() => result.current.refresh());
    act(() => result.current.settleRefresh(false));
    expect(result.current.refreshError).toBeNull();
  });

  it('drops a pending refresh when the data changes', () => {
    const { result, rerender } = renderHook(({ key }: { key: string }) => useLoadRequest(key), { initialProps: { key: 't1' } });
    act(() => result.current.refresh());
    act(() => result.current.settleRefresh(true));
    act(() => result.current.refresh());

    rerender({ key: 't2' });
    expect(result.current.request).toEqual({ key: 't2', id: 0, refresh: false });
    expect(result.current.refreshing).toBe(false);
    expect(result.current.refreshError).toBeNull();
  });
});
