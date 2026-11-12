import type { MainTabParamList, RootStackParamList } from '../../navigation/types';

export const SCREEN_NAMES = {
  HomeTab: true, MyGamesTab: true, ProfileTab: true,
  TournamentsScreen: true, TournamentScreen: true, TournamentStatsScreen: true,
  GameDetailScreen: true, TeamScreen: true, AthleteScreen: true,
  OrganizationScreen: true, OrganizationsScreen: true, AccountScreen: true,
  AthleteProfileEditScreen: true, AuthScreen: true, WebAuthFlowScreen: true,
} satisfies Record<Exclude<keyof RootStackParamList, 'MainTabs'> | keyof MainTabParamList, true>;

export type ScreenName = keyof typeof SCREEN_NAMES;
export type Sticker = 'profile' | 'game';
export const ATHLETE_FIELDS = ['name', 'facebook', 'instagram', 'twitter', 'photo_url'] as const;
export type AthleteChangedField = typeof ATHLETE_FIELDS[number];

export type EventProperties = {
  'Screen Viewed': { screen_name: ScreenName };
  'Screen Exited': { screen_name: ScreenName; duration_ms: number; is_live?: boolean };
  'Share Sheet Opened': { sticker: Sticker };
  'Sticker Shared': { sticker: Sticker; action: 'copy' | 'save' | 'share'; format_id: string; has_photo: boolean };
  'Live Game Viewed': { game_id: string; tournament_id: string | null; organization_id: string | null };
  'Athlete Profile Saved': { is_new: boolean; changed_fields: AthleteChangedField[] };
  session_start: Record<string, never>;
  session_end: Record<string, never>;
};

type Rule = (value: unknown) => boolean;
const member = (values: readonly string[]): Rule => (value) => typeof value === 'string' && values.includes(value);
const boolean: Rule = (value) => typeof value === 'boolean';
const opaqueId: Rule = (value) => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
const nullableId: Rule = (value) => value === null || opaqueId(value);
const screen: Rule = (value) => typeof value === 'string' && Object.hasOwn(SCREEN_NAMES, value);
const sticker = member(['profile', 'game']);

// This is the only event/property allowlist, including automatic SDK sessions.
export const EVENT_SCHEMA: Record<keyof EventProperties, Record<string, Rule>> = {
  'Screen Viewed': { screen_name: screen },
  'Screen Exited': {
    screen_name: screen,
    duration_ms: (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0,
    is_live: (value) => value === undefined || boolean(value),
  },
  'Share Sheet Opened': { sticker },
  'Sticker Shared': {
    sticker, action: member(['copy', 'save', 'share']),
    format_id: member(['bottom-dark', 'bottom-light', 'center-dark', 'center-light',
      'bottom-left-dark', 'bottom-left-light', 'bottom-right-dark', 'bottom-right-light']),
    has_photo: boolean,
  },
  'Live Game Viewed': { game_id: opaqueId, tournament_id: nullableId, organization_id: nullableId },
  'Athlete Profile Saved': {
    is_new: boolean,
    changed_fields: (value) => Array.isArray(value) && value.every(member(ATHLETE_FIELDS)),
  },
  session_start: {},
  session_end: {},
};

export function validEvent(name: string, properties: unknown): properties is Record<string, unknown> {
  if (!Object.hasOwn(EVENT_SCHEMA, name) || !properties || typeof properties !== 'object' || Array.isArray(properties)) return false;
  const rules = EVENT_SCHEMA[name as keyof EventProperties];
  const values = properties as Record<string, unknown>;
  return Object.keys(values).every((key) => Object.hasOwn(rules, key)) &&
    Object.entries(rules).every(([key, rule]) => rule(values[key]));
}

export type AnalyticsMetadata = { app_version: string; build_number: string; platform: 'ios' | 'android' };

export function safeProperties(name: string, properties: unknown, metadata: AnalyticsMetadata) {
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) return null;
  const { app_version: _version, build_number: _build, platform: _platform, ...custom } = properties as Record<string, unknown>;
  return validEvent(name, custom) ? { ...custom, ...metadata } : null;
}
