import { Tournament } from '../../../../models/Tournament';
import { homeTournaments, MAX_HOME_TOURNAMENTS, MAX_SEARCH_RESULTS, searchResults, sortWithPinnedFirst } from '../homeTournaments';

const tournament = (id: string): Tournament => ({
  id,
  name: `Copa ${id}`,
  slug: id,
  organization: { id: `org-${id}`, name: 'Liga Sul', slug: `org-${id}` },
});

const ids = (tournaments: Tournament[]) => tournaments.map((item) => item.id);

describe('sortWithPinnedFirst', () => {
  it('keeps the API order when nothing is pinned', () => {
    const list = [tournament('a'), tournament('b')];
    expect(sortWithPinnedFirst(list, [])).toBe(list);
  });

  it('puts pinned tournaments first, in pin order, and keeps the rest in API order', () => {
    const list = [tournament('a'), tournament('b'), tournament('c'), tournament('d')];
    expect(ids(sortWithPinnedFirst(list, ['d', 'b']))).toEqual(['d', 'b', 'a', 'c']);
  });
});

describe('homeTournaments', () => {
  it('caps the list at 12 tournaments', () => {
    expect(MAX_HOME_TOURNAMENTS).toBe(12);
    const list = Array.from({ length: 20 }, (_, index) => tournament(`t${index}`));
    const result = homeTournaments(list, []);
    expect(result).toHaveLength(MAX_HOME_TOURNAMENTS);
    expect(result[0].id).toBe('t0');
  });

  it('keeps a pinned tournament beyond the cap at the top', () => {
    const list = Array.from({ length: 20 }, (_, index) => tournament(`t${index}`));
    const result = homeTournaments(list, ['t19']);
    expect(result[0].id).toBe('t19');
    expect(result).toHaveLength(MAX_HOME_TOURNAMENTS);
  });
});

describe('searchResults', () => {
  it('keeps the API order and caps the results at 15', () => {
    expect(MAX_SEARCH_RESULTS).toBe(15);
    const list = Array.from({ length: 20 }, (_, index) => tournament(`t${index}`));
    expect(ids(searchResults(list))).toEqual(ids(list.slice(0, MAX_SEARCH_RESULTS)));
  });
});
