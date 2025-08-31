import { type DashEvent, type DashData } from '@repo/shared/types/dash';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

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

  private key(userId: string): string {
    return `dash:user:${userId}`;
  }

  async get(userId: string): Promise<DashData | null> {
    const raw = await this.redis.get(this.key(userId));
    return raw ? (JSON.parse(raw) as DashData) : null;
  }

  async create(userId: string): Promise<DashData> {
    const dash: DashData = {
      dashId: uuidv4(),
      userId,
      status: 'initialized',
      events: [],
    };
    await this.redis.set(
      this.key(userId),
      JSON.stringify(dash),
      'EX',
      this.TTL_SECONDS
    );
    return dash;
  }

  async createOrGet(userId: string): Promise<DashData> {
    const existing = await this.get(userId);
    if (existing && existing.status !== 'completed') {
      return existing;
    }
    return this.create(userId);
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
    await this.redis.set(
      this.key(userId),
      JSON.stringify(dash),
      'EX',
      this.TTL_SECONDS
    );
    return dash;
  }

  async delete(userId: string): Promise<void> {
    await this.redis.del(this.key(userId));
  }

  private async getOrThrow(userId: string): Promise<DashData> {
    const dash = await this.get(userId);
    if (!dash) throw new Error('NO_DASH');
    return dash;
  }
}

export const redisDashService = new RedisDashService();
