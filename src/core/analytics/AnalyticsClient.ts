import { EventProperties, validEvent } from './events';

export interface AnalyticsTransport {
  setUserId: (userId: string | undefined) => void;
  reset: () => void;
  track: (name: string, properties: Record<string, unknown>, time: number) => void;
  flush: () => void;
}

type Options = {
  enabled: boolean;
  hashUsername: (username: string) => Promise<string>;
  load: (userId: string | undefined) => Promise<AnalyticsTransport>;
};
type PendingEvent = { name: string; properties: Record<string, unknown>; time: number };

export class AnalyticsClient {
  private tail = Promise.resolve();
  private started = false;
  private transport?: AnalyticsTransport;
  private pending: PendingEvent[] = [];

  constructor(private readonly options: Options) {}

  // Nothing is imported or initialized until saved authentication has settled.
  identify(username: string | null) {
    if (!this.options.enabled) return;
    this.started = true;
    this.enqueue(async () => {
      const userId = username ? await this.options.hashUsername(username) : undefined;
      if (userId && !/^[a-f0-9]{64}$/.test(userId)) throw new Error('Invalid analytics identity');
      if (!this.transport) {
        this.transport = await this.options.load(userId);
        for (const event of this.pending) this.send(event);
        this.pending = [];
      } else if (userId) this.transport.setUserId(userId);
      else this.transport.reset();
    });
  }

  track<Name extends keyof EventProperties>(name: Name, properties: EventProperties[Name]) {
    if (!this.options.enabled || !validEvent(name, properties)) return;
    // Clone before deferring: callers cannot mutate a validated payload later.
    const event = { name, properties: JSON.parse(JSON.stringify(properties)), time: Date.now() };
    if (!this.started) {
      if (this.pending.length < 100) this.pending.push(event);
      return;
    }
    this.enqueue(() => this.send(event));
  }

  flush() {
    if (this.options.enabled && this.started) this.enqueue(() => this.transport?.flush());
  }

  private send(event: PendingEvent) {
    this.transport?.track(event.name, event.properties, event.time);
  }

  private enqueue(action: () => void | Promise<void>) {
    this.tail = this.tail.then(action).catch(() => { /* Analytics never interrupts the app. */ });
  }

  /** Waits for local setup/dispatch, never for ingestion or network retries. */
  settled() { return this.tail; }
}
