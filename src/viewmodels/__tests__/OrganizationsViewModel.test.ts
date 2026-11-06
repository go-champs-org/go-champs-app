import { act, renderHook, waitFor } from '@testing-library/react-native';
import { container } from '../../di/container';
import { useOrganizationsViewModel } from '../OrganizationsViewModel';

jest.mock('../../di/container', () => ({
  container: {
    getOrganizationDirectory: { execute: jest.fn() },
  },
}));

const organization = (name: string) => ({ id: name, name, slug: name.toLowerCase() });

describe('useOrganizationsViewModel', () => {
  it('lists the most viewed organizations and searches every one', async () => {
    (container.getOrganizationDirectory.execute as jest.Mock).mockResolvedValue({
      recent: [organization('Liga Norte')],
      all: [organization('Liga Norte'), organization('GARRAFÃO SEGURO')],
    });

    const { result } = renderHook(() => useOrganizationsViewModel());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.organizations.map((item) => item.name)).toEqual(['Liga Norte']);
    expect(result.current.isSearching).toBe(false);

    act(() => result.current.setQuery('garrafao'));
    expect(result.current.query).toBe('garrafao');
    expect(result.current.isSearching).toBe(true);
    expect(result.current.organizations.map((item) => item.name)).toEqual(['GARRAFÃO SEGURO']);
  });

  it('drops the load once unmounted', async () => {
    let resolve: (value: unknown) => void = () => undefined;
    (container.getOrganizationDirectory.execute as jest.Mock).mockReturnValue(new Promise((done) => { resolve = done; }));

    const { result, unmount } = renderHook(() => useOrganizationsViewModel());
    unmount();
    await act(async () => {
      resolve({ recent: [organization('Liga Norte')], all: [] });
    });
    expect(result.current.organizations).toEqual([]);
  });
});
