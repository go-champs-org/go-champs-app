import { useEffect, useState } from 'react';
import { AppError } from '../core/errors/AppError';
import { container } from '../di/container';
import { OrganizationOverview } from '../domain/usecases/GetOrganizationOverviewUseCase';
import { useLoadRequest } from './useLoadRequest';

const ORGANIZATION_ERROR = 'Não foi possível abrir a organização. Tente novamente.';

export const useOrganizationViewModel = (organizationSlug: string, apiBaseUrl?: string) => {
  const [overview, setOverview] = useState<OrganizationOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { request, refreshing, refreshError, retry, refresh, settleRefresh } = useLoadRequest(
    `${organizationSlug}|${apiBaseUrl ?? ''}`
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!request.refresh) {
        setLoading(true);
        setError(null);
      }
      try {
        const next = await container.getOrganizationOverview.execute(organizationSlug, apiBaseUrl);
        if (!mounted) return;
        setOverview(next);
        if (request.refresh) settleRefresh(false);
      } catch (requestError) {
        if (!mounted) return;
        // A failed refresh keeps the organization on screen.
        if (request.refresh) {
          settleRefresh(true);
          return;
        }
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
  }, [organizationSlug, apiBaseUrl, request, settleRefresh]);

  return { overview, loading, error, retry, refreshing, refreshError, refresh };
};
