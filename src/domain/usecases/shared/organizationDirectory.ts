import { Organization } from '../../../models/Organization';
import { OrganizationDirectory } from '../GetOrganizationDirectoryUseCase';

// The public home sidebar shows at most 15 organizations.
export const MAX_RECENT_ORGANIZATIONS = 15;

// Lower case without accents, so "garrafao" finds "GARRAFÃO SEGURO".
export const searchableText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/**
 * Before anything is typed, the most viewed organizations; while typing, every
 * organization whose name has the term, in alphabetical order.
 */
export const visibleOrganizations = (directory: OrganizationDirectory, query: string): Organization[] => {
  const term = searchableText(query);
  if (!term) return directory.recent.slice(0, MAX_RECENT_ORGANIZATIONS);

  return directory.all
    .filter((organization) => searchableText(organization.name).includes(term))
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));
};
