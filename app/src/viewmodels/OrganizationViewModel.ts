import { useEffect, useState } from 'react';
import { Organization } from '../models/Organization';
import { getOrganizations } from '../services/OrganizationService';

export const useOrganizationViewModel = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(true);
      const data = await getOrganizations();
      setOrganizations(data);
      setLoading(false);
    };

    fetchOrganizations();
  }, []);

  return { organizations, loading };
};
