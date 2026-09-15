import { useState } from 'react';
import { AppError } from '../core/errors/AppError';
import { AuthenticatedUser } from '../domain/repositories/AccountRepository';
import { container } from '../di/container';

type SignInValues = {
  password: string;
  username: string;
};

const messageFromError = (error: unknown) =>
  error instanceof AppError ? error.message : 'Não foi possível entrar. Tente novamente em instantes.';

export const useAuthViewModel = (onAuthenticated: (user: AuthenticatedUser) => void | Promise<void>) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async ({ username, password }: SignInValues) => {
    if (!username.trim() || !password) {
      setError('Informe seu usuário ou e-mail e sua senha.');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await container.signIn.execute({ username: username.trim(), password });
      await onAuthenticated(user);
      return true;
    } catch (requestError) {
      setError(messageFromError(requestError));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { error, loading, signIn };
};
