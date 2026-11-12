import { useCallback, useEffect, useState } from 'react';
import { container } from '../di/container';
import { ResolvedGoChampsLink } from '../domain/usecases/ResolveGoChampsLinkUseCase';

const LINK_ERROR = 'Não foi possível abrir o link. Tente novamente.';

type Outcome = { key: string; resolved: ResolvedGoChampsLink | null; error: string | null };

// Resolves a go-champs.com link the app was opened with to the screen it
// names. The screen navigates once `resolved` is set.
export const useGoChampsLinkViewModel = (path: string) => {
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  // Each attempt at each path is its own load; an outcome of an earlier one
  // reads as still loading.
  const key = `${attempt}|${path}`;

  useEffect(() => {
    let mounted = true;

    container.resolveGoChampsLink
      .execute(path)
      .then((resolved) => {
        if (mounted) setOutcome({ key, resolved, error: null });
      })
      .catch(() => {
        if (mounted) setOutcome({ key, resolved: null, error: LINK_ERROR });
      });

    return () => {
      mounted = false;
    };
  }, [path, key]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  const current = outcome?.key === key ? outcome : null;
  return { resolved: current?.resolved ?? null, loading: !current, error: current?.error ?? null, retry };
};
