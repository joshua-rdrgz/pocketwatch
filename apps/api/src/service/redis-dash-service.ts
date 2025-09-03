import { DashInfo } from '@repo/shared/lib/dash';
import { type DashEvent, type DashData } from '@repo/shared/types/dash';
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

  async get(
    userId: string,
    { shouldGetMetadata }: { shouldGetMetadata: boolean } = {
      shouldGetMetadata: false,
    }
  ): Promise<DashData | null> {
    const raw = await this.redis.get(this.dashKey(userId));
    const parsed = raw ? (JSON.parse(raw) as DashData) : null;

    if (shouldGetMetadata) {
      const rawMetadata = await this.redis.get(this.metadataKey(userId));

      if (parsed && rawMetadata) {
        parsed.metadata = JSON.parse(rawMetadata);
      }
    }
    return parsed;
  }

  async create(userId: string): Promise<DashData> {
    const dash: DashData = {
      userId,
      status: 'initialized',
      events: [],
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
    const existing = await this.get(userId);
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
      isMonetized: info.isMonetized ? '1' : '0', // Redis stores strings, so convert boolean
      hourlyRate: info.hourlyRate?.toString() || '0',
    });

    // Set TTL on the hash
    await this.redis.expire(key, this.TTL_SECONDS);

    return info;
  }

  async addEvent(userId: string, event: DashEvent): Promise<DashData> {
    const dash = await this.getOrThrow(userId);
    // Append event first
    dash.events.push(event);
    // Only flip status on lifecycle events; avoid scanning entire history
    switch (event.action) {
      case 'start':
        dash.status = 'active';
        break;
      case 'finish':
        dash.status = 'completed';
    }
    await this.redis.setex(
      this.dashKey(userId),
      this.TTL_SECONDS,
      JSON.stringify(dash)
    );
    return dash;
  }

  async delete(userId: string): Promise<void> {
    await this.redis.del(this.dashKey(userId));
  }

  private async getOrThrow(userId: string): Promise<DashData> {
    const dash = await this.get(userId);
    if (!dash) throw new Error('NO_DASH');
    return dash;
  }
}

export const redisDashService = new RedisDashService();
