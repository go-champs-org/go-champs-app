import { Organization } from '../../../../models/Organization';
import { MAX_RECENT_ORGANIZATIONS, searchableText, visibleOrganizations } from '../organizationDirectory';

const organization = (name: string, id = name): Organization => ({ id, name, slug: id });

describe('searchableText', () => {
  it('drops accents, case and surrounding spaces', () => {
    expect(searchableText('  GARRAFÃO Seguro ')).toBe('garrafao seguro');
  });
});

describe('visibleOrganizations', () => {
  const all = [organization('Liga Norte'), organization('GARRAFÃO SEGURO'), organization('Associação Sul')];

  it('shows the most viewed, capped, when nothing is typed', () => {
    const recent = Array.from({ length: 20 }, (_, index) => organization(`Org ${index}`));
    const result = visibleOrganizations({ recent, all }, '  ');
    expect(result).toHaveLength(MAX_RECENT_ORGANIZATIONS);
    expect(result[0].name).toBe('Org 0');
  });

  it('searches every organization, ignoring accents, in alphabetical order', () => {
    expect(visibleOrganizations({ recent: [], all }, 'garrafao').map((item) => item.name)).toEqual(['GARRAFÃO SEGURO']);
    expect(visibleOrganizations({ recent: [], all }, 'a').map((item) => item.name)).toEqual([
      'Associação Sul',
      'GARRAFÃO SEGURO',
      'Liga Norte',
    ]);
    expect(visibleOrganizations({ recent: [], all }, 'inexistente')).toEqual([]);
  });
});
