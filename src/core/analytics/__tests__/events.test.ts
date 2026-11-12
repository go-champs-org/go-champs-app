import { EVENT_SCHEMA, safeProperties, validEvent } from '../events';
import { PROFILE_SHARE_FORMATS } from '../../../domain/usecases/shared/profileShare';
import { GAME_SHARE_FORMATS } from '../../../domain/usecases/shared/gameShare';

const metadata = { app_version: '1.0.0', build_number: '17', platform: 'ios' as const };
const events = {
  'Screen Viewed': { screen_name: 'HomeTab' },
  'Screen Exited': { screen_name: 'GameDetailScreen', duration_ms: 60_000, is_live: true },
  'Share Sheet Opened': { sticker: 'profile' },
  'Sticker Shared': { sticker: 'game', action: 'share', format_id: 'bottom-left-dark', has_photo: false },
  'Live Game Viewed': { game_id: 'game-1', tournament_id: 't1', organization_id: null },
  'Athlete Profile Saved': { is_new: false, changed_fields: ['name', 'photo_url'] },
  session_start: {}, session_end: {},
};

describe('analytics contract', () => {
  it('specifies every event, including automatic SDK sessions', () => {
    expect(Object.keys(EVENT_SCHEMA).sort()).toEqual(Object.keys(events).sort());
  });
  it.each(Object.entries(events))('accepts only declared properties of %s', (name, payload) => {
    expect(validEvent(name, payload)).toBe(true);
    expect(safeProperties(name, payload, metadata)).toEqual({ ...payload, ...metadata });
    for (const key of ['username', 'email', 'name', 'token', 'team_name', 'photo_url', 'anything_new']) {
      expect(validEvent(name, { ...payload, [key]: 'private' })).toBe(false);
      expect(safeProperties(name, { ...payload, [key]: 'private' }, metadata)).toBeNull();
    }
  });
  it.each([null, undefined, [], 'private', 1])('rejects malformed properties %p', (payload) => {
    expect(validEvent('Screen Viewed', payload)).toBe(false);
    expect(safeProperties('Screen Viewed', payload, metadata)).toBeNull();
  });
  it('rejects unknown events, undeclared screen names and invalid durations', () => {
    expect(validEvent('arbitrary', {})).toBe(false);
    expect(validEvent('Screen Viewed', { screen_name: 'Ana Silva' })).toBe(false);
    for (const duration_ms of [NaN, Infinity, -1, '100']) {
      expect(validEvent('Screen Exited', { screen_name: 'HomeTab', duration_ms })).toBe(false);
    }
    expect(validEvent('Screen Exited', { screen_name: 'HomeTab', duration_ms: 0 })).toBe(true);
  });
  it('only accepts actual sticker formats and closed action enums', () => {
    for (const format of [...PROFILE_SHARE_FORMATS, ...GAME_SHARE_FORMATS]) {
      expect(validEvent('Sticker Shared', { ...events['Sticker Shared'], format_id: format.id })).toBe(true);
    }
    expect(validEvent('Sticker Shared', { ...events['Sticker Shared'], format_id: 'private-name' })).toBe(false);
    expect(validEvent('Sticker Shared', { ...events['Sticker Shared'], action: 'clicked' })).toBe(false);
    expect(validEvent('Share Sheet Opened', { sticker: 'other' })).toBe(false);
  });
  it('allows opaque ids or unknown parents, never addresses, names or URLs', () => {
    for (const game_id of ['Ana Silva', 'a@example.com', 'https://private/path', '', 42]) {
      expect(validEvent('Live Game Viewed', { ...events['Live Game Viewed'], game_id })).toBe(false);
    }
    expect(validEvent('Live Game Viewed', { game_id: 'g1', tournament_id: null, organization_id: null })).toBe(true);
  });
  it('only accepts field names, not the saved values', () => {
    for (const changed_fields of [['Ana Silva'], [{ name: 'Ana' }], 'name']) {
      expect(validEvent('Athlete Profile Saved', { is_new: true, changed_fields })).toBe(false);
    }
  });
  it('always uses native build metadata, not caller-supplied values', () => {
    expect(safeProperties('Screen Viewed', { screen_name: 'HomeTab', app_version: 'private', platform: 'web', build_number: 'x' }, metadata))
      .toEqual({ screen_name: 'HomeTab', ...metadata });
  });
});
