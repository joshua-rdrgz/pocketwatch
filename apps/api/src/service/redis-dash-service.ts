import { DashInfo } from '@repo/shared/lib/dash';
import { validateAndSortDashEvents } from '@repo/shared/lib/dash-validation';
import { type DashData, type DashEvent } from '@repo/shared/types/dash';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';

/**
 * Minimal per-user dash store.
 * Invariant: at most one active dash per user.
 * Key shape: dash:user:{userId} → JSON(DashData)
 */
class RedisDashService {
  private redis: Redis;
  private readonly TTL_SECONDS = 86400; // 24h

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.redis.on('error', (err) => console.error('Redis error:', err));
  }

  private dashKey(userId: string): string {
    return `dash:user:${userId}`;
  }

  private metadataKey(userId: string): string {
    return `dash:user:metadata:${userId}`;
  }

  private originalEventsKey(userId: string): string {
    return `dash:user:original:${userId}`;
  }

  async get(
    userId: string,
    {
      shouldGetMetadata,
      shouldGetOriginal,
    }: { shouldGetMetadata?: boolean; shouldGetOriginal?: boolean } = {}
  ): Promise<DashData | null> {
    const raw = await this.redis.get(this.dashKey(userId));
    const parsed = raw ? (JSON.parse(raw) as DashData) : null;

    if (parsed) {
      if (shouldGetMetadata) {
        const rawMetadata = await this.redis.hgetall(this.metadataKey(userId));
        if (rawMetadata) {
          parsed.metadata = {
            name: rawMetadata.name || '',
            category: rawMetadata.category || '',
            notes: rawMetadata.notes || '',
            isMonetized: rawMetadata.isMonetized === '1',
            hourlyRate: rawMetadata.hourlyRate
              ? Number(rawMetadata.hourlyRate)
              : 0,
          };
        }
      }

      if (shouldGetOriginal) {
        const rawOriginal = await this.redis.get(
          this.originalEventsKey(userId)
        );
        parsed.originalEvents = rawOriginal ? JSON.parse(rawOriginal) : null;
      }
    }

    return parsed;
  }

  async getOriginalEvents(userId: string): Promise<DashEvent[] | null> {
    const raw = await this.redis.get(this.originalEventsKey(userId));
    return raw ? JSON.parse(raw) : null;
  }

  async create(userId: string): Promise<DashData> {
    const dash: DashData = {
      userId,
      status: 'initialized',
      events: [],
      originalEvents: [],
    };
    const dashInfo: DashInfo = {
      name: '',
      category: '',
      notes: '',
      isMonetized: false,
      hourlyRate: 0,
    };

    await this.redis.setex(
      this.dashKey(userId),
      this.TTL_SECONDS,
      JSON.stringify(dash)
    );

    await this.setMetadata(userId, dashInfo);

    return {
      ...dash,
      metadata: dashInfo,
    };
  }

  async createOrGet(userId: string): Promise<DashData> {
    const existing = await this.get(userId, { shouldGetMetadata: true });
    if (existing && existing.status !== 'completed') {
      return existing;
    }
    return this.create(userId);
  }

  async setMetadata(userId: string, info: DashInfo): Promise<DashInfo> {
    const key = this.metadataKey(userId);

    await this.redis.hset(key, {
      name: info.name || '',
      category: info.category || '',
      notes: info.notes || '',
      isMonetized: info.isMonetized ? '1' : '0',
      hourlyRate: info.hourlyRate?.toString() || '0',
    });

    // Set TTL on the hash
    await this.redis.expire(key, this.TTL_SECONDS);

    return info;
  }

  async addEvent(
    userId: string,
    event: Omit<DashEvent, 'id'>
  ): Promise<DashEvent> {
    const dash = await this.getOrThrow(userId);
    const eventWithId: DashEvent = {
      ...event,
      id: randomUUID(),
    };

    dash.events.push(eventWithId);

    // Store original events snapshot when finish occurs
    if (event.action === 'finish') {
      await this.redis.setex(
        this.originalEventsKey(userId),
        this.TTL_SECONDS,
        JSON.stringify(dash.events)
      );
      dash.status = 'completed';
    } else if (event.action === 'start') {
      dash.status = 'active';
    }

    await this.redis.setex(
      this.dashKey(userId),
      this.TTL_SECONDS,
      JSON.stringify(dash)
    );

    return eventWithId;
  }

  async updateEvents(
    userId: string,
    events: DashEvent[]
  ): Promise<DashEvent[]> {
    const validSortedEvents = validateAndSortDashEvents(events);

    // Re-assign IDs to all events, keeping existing IDs where they exist
    const eventsWithNewIds = validSortedEvents.map((event) => ({
      ...event,
      id: event.id?.startsWith('temp-') ? randomUUID() : event.id,
    }));

    const dash = await this.getOrThrow(userId);
    dash.events = eventsWithNewIds;

    await this.redis.setex(
      this.dashKey(userId),
      this.TTL_SECONDS,
      JSON.stringify(dash)
    );

    return dash.events;
  }

  async delete(userId: string): Promise<void> {
    await this.redis.del(this.dashKey(userId));
    await this.redis.del(this.metadataKey(userId));
  }

  private async getOrThrow(userId: string): Promise<DashData> {
    const dash = await this.get(userId);
    if (!dash) throw new Error('NO_DASH');
    return dash;
  }
}

export const redisDashService = new RedisDashService();
