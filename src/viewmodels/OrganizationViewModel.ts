import { useCallback, useEffect, useState } from 'react';
import { AppError } from '../core/errors/AppError';
import { container } from '../di/container';
import { OrganizationOverview } from '../domain/usecases/GetOrganizationOverviewUseCase';

const ORGANIZATION_ERROR = 'Não foi possível abrir a organização. Tente novamente.';

export const useOrganizationViewModel = (organizationSlug: string, apiBaseUrl?: string) => {
  const [overview, setOverview] = useState<OrganizationOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const next = await container.getOrganizationOverview.execute(organizationSlug, apiBaseUrl);
        if (mounted) setOverview(next);
      } catch (requestError) {
        if (!mounted) return;
        setOverview(null);
        setError(requestError instanceof AppError && requestError.status === 404 ? requestError.message : ORGANIZATION_ERROR);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();

    return () => {
      mounted = false;
    };
  }, [organizationSlug, apiBaseUrl, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { overview, loading, error, retry };
};
