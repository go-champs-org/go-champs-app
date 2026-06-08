import { useEffect, useState } from 'react';
import { Organization } from '../models/Organization';
import { container } from '../di/container';

export const useOrganizationViewModel = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(true);
      const data = await container.getOrganizations.execute();
      setOrganizations(data);
      setLoading(false);
    };

    fetchOrganizations();
  }, []);

  return { organizations, loading };
};
