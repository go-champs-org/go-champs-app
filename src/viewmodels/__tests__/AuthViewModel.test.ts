import { act, renderHook } from '@testing-library/react-native';
import { AppError } from '../../core/errors/AppError';
import { container } from '../../di/container';
import { useAuthViewModel } from '../AuthViewModel';

jest.mock('../../di/container', () => ({ container: { signIn: { execute: jest.fn() } } }));

describe('useAuthViewModel', () => {
  const onAuthenticated = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('validates required credentials before submitting', async () => {
    const { result } = renderHook(() => useAuthViewModel(onAuthenticated));

    await act(async () => expect(await result.current.signIn({ username: '', password: '' })).toBe(false));

    expect(result.current.error).toBe('Informe seu usuário ou e-mail e sua senha.');
    expect(container.signIn.execute).not.toHaveBeenCalled();
  });

  it('authenticates and exposes the returned user', async () => {
    const user = { email: 'ana@example.com', token: 'token', username: 'ana' };
    jest.mocked(container.signIn.execute).mockResolvedValue(user);
    const { result } = renderHook(() => useAuthViewModel(onAuthenticated));

    await act(async () => expect(await result.current.signIn({ username: ' ana ', password: 'secret' })).toBe(true));

    expect(container.signIn.execute).toHaveBeenCalledWith({ username: 'ana', password: 'secret' });
    expect(onAuthenticated).toHaveBeenCalledWith(user);
    expect(result.current.error).toBeNull();
  });

  it('shows an API message when authentication fails', async () => {
    jest.mocked(container.signIn.execute).mockRejectedValue(new AppError('Credenciais inválidas', 401));
    const { result } = renderHook(() => useAuthViewModel(onAuthenticated));

    await act(async () => expect(await result.current.signIn({ username: 'ana', password: 'bad' })).toBe(false));

    expect(result.current.error).toBe('Credenciais inválidas');
  });
});
