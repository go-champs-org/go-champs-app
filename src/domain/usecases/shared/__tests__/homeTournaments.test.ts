import { Tournament } from '../../../../models/Tournament';
import { homeTournaments, MAX_HOME_TOURNAMENTS, sortWithPinnedFirst } from '../homeTournaments';

const tournament = (id: string, name = `Copa ${id}`, organizationName = 'Liga Sul'): Tournament => ({
  id,
  name,
  slug: id,
  organization: { id: `org-${id}`, name: organizationName, slug: `org-${id}` },
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
  it('caps the list like the public home', () => {
    const list = Array.from({ length: 20 }, (_, index) => tournament(`t${index}`));
    const result = homeTournaments(list, [], '');
    expect(result).toHaveLength(MAX_HOME_TOURNAMENTS);
    expect(result[0].id).toBe('t0');
  });

  it('keeps a pinned tournament beyond the cap at the top', () => {
    const list = Array.from({ length: 20 }, (_, index) => tournament(`t${index}`));
    const result = homeTournaments(list, ['t19'], '');
    expect(result[0].id).toBe('t19');
    expect(result).toHaveLength(MAX_HOME_TOURNAMENTS);
  });

  it('searches by tournament or organization name, ignoring case and spaces around it', () => {
    const list = [
      tournament('a', 'Copa Grupos'),
      tournament('b', 'Copa Playoffs', 'Federação Norte'),
      tournament('c', 'Liga Verão'),
    ];
    expect(ids(homeTournaments(list, [], '  grupos '))).toEqual(['a']);
    expect(ids(homeTournaments(list, [], 'NORTE'))).toEqual(['b']);
    expect(homeTournaments(list, [], 'inexistente')).toEqual([]);
  });

  it('applies the cap after the search', () => {
    const list = [
      ...Array.from({ length: 20 }, (_, index) => tournament(`t${index}`)),
      tournament('late', 'Torneio Raro'),
    ];
    expect(ids(homeTournaments(list, [], 'raro'))).toEqual(['late']);
  });
});
