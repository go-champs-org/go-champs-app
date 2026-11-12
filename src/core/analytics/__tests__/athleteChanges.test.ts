import { athleteChanges } from '../athleteChanges';
import { AthleteProfile } from '../../../domain/repositories/AthleteProfileRepository';

const original: AthleteProfile = { id: 'a1', username: 'private', name: 'Ana', photo_url: 'https://private/photo.jpg', facebook: null, instagram: '@ana', twitter: null };
const values = { name: 'Ana', facebook: '', instagram: '@ana', twitter: '' };

it('tracks normalized differences as field names only', () => {
  expect(athleteChanges(original, { ...values, name: ' Ana ', facebook: '  ' }, { kind: 'keep' })).toEqual([]);
  const changed = athleteChanges(original, { ...values, name: 'New Name', instagram: '@private' }, { kind: 'replace', file: { uri: 'file:///private', mimeType: 'image/png', fileName: 'private.png' } });
  expect(changed).toEqual(['name', 'instagram', 'photo_url']);
  expect(JSON.stringify(changed)).not.toContain('private');
});

it('includes only provided fields on create and actual photo removals', () => {
  expect(athleteChanges(null, { name: 'Ana', facebook: '', instagram: '', twitter: '' }, { kind: 'keep' })).toEqual(['name']);
  expect(athleteChanges(original, values, { kind: 'remove' })).toEqual(['photo_url']);
  expect(athleteChanges({ ...original, photo_url: null }, values, { kind: 'remove' })).toEqual([]);
});
