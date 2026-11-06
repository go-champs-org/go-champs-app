import { useEffect, useMemo, useState } from 'react';
import { container } from '../di/container';
import { OrganizationDirectory } from '../domain/usecases/GetOrganizationDirectoryUseCase';
import { visibleOrganizations } from '../domain/usecases/shared/organizationDirectory';

// The organizations list opened from the menu: the most viewed ones, and every
// organization while searching.
export const useOrganizationsViewModel = () => {
  const [directory, setDirectory] = useState<OrganizationDirectory>({ recent: [], all: [] });
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    container.getOrganizationDirectory
      .execute()
      .then((loaded) => {
        if (isCurrent) setDirectory(loaded);
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const organizations = useMemo(() => visibleOrganizations(directory, query), [directory, query]);

  return {
    organizations,
    query,
    setQuery,
    isSearching: query.trim().length > 0,
    loading,
  };
};
