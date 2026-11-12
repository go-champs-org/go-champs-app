import type { AnalyticsClient } from './AnalyticsClient';
import { EventProperties, SCREEN_NAMES, ScreenName } from './events';

type Route = { key: string; name: string };
type Visit = { route: Route; start: number | null; isLive: boolean; liveTracked: boolean };
type LiveGame = EventProperties['Live Game Viewed'];

export class ScreenTracker {
  private current?: Visit;
  private active = true;
  private live = new Map<string, LiveGame>();

  constructor(private readonly analytics: Pick<AnalyticsClient, 'track' | 'flush'>, private readonly now = () => performance.now()) {}

  navigate(route?: Route) {
    if (this.current?.route.key === route?.key) return;
    this.exit();
    this.current = route && Object.hasOwn(SCREEN_NAMES, route.name)
      ? { route, start: null, isLive: false, liveTracked: false } : undefined;
    this.enter();
  }

  setActive(active: boolean) {
    if (active === this.active) return;
    if (!active) {
      this.exit();
      this.analytics.flush();
    }
    this.active = active;
    if (active) this.enter();
  }

  registerLive(key: string, game: LiveGame) {
    this.live.set(key, game);
    this.trackLive();
  }

  forgetLive(key: string) { this.live.delete(key); }

  dispose() {
    this.exit();
    this.current = undefined;
    this.live.clear();
  }

  private enter() {
    if (!this.active || !this.current) return;
    this.current.start = this.now();
    this.analytics.track('Screen Viewed', { screen_name: this.current.route.name as ScreenName });
    this.trackLive();
  }

  private exit() {
    if (!this.current || this.current.start === null) return;
    this.analytics.track('Screen Exited', {
      screen_name: this.current.route.name as ScreenName,
      duration_ms: Math.max(0, Math.round(this.now() - this.current.start)),
      ...(this.current.isLive ? { is_live: true } : {}),
    });
    this.current.start = null;
  }

  private trackLive() {
    if (!this.active || !this.current || this.current.route.name !== 'GameDetailScreen') return;
    const game = this.live.get(this.current.route.key);
    if (!game) return;
    this.current.isLive = true;
    if (this.current.liveTracked) return;
    this.current.liveTracked = true;
    this.analytics.track('Live Game Viewed', game);
  }
}
