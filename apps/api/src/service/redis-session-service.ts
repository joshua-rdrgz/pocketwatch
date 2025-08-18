import { type Event, type SessionData } from '@repo/shared/types/session';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

/**
 * Minimal per-user session store.
 * Invariant: at most one active session per user.
 * Key shape: session:user:{userId} → JSON(SessionData)
 */
class RedisSessionService {
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
    return `session:user:${userId}`;
  }

  async get(userId: string): Promise<SessionData | null> {
    const raw = await this.redis.get(this.key(userId));
    return raw ? (JSON.parse(raw) as SessionData) : null;
  }

  async create(userId: string): Promise<SessionData> {
    const session: SessionData = {
      sessionId: uuidv4(),
      userId,
      startTime: Date.now(),
      status: 'idle',
      events: [],
    };
    await this.redis.set(
      this.key(userId),
      JSON.stringify(session),
      'EX',
      this.TTL_SECONDS
    );
    return session;
  }

  async createOrGet(userId: string): Promise<SessionData> {
    const existing = await this.get(userId);
    if (
      existing &&
      (existing.status === 'idle' || existing.status === 'active')
    ) {
      return existing;
    }
    return this.create(userId);
  }

  async assignTask(userId: string, taskId: string): Promise<SessionData> {
    const session = await this.getOrThrow(userId);
    session.taskId = taskId;
    await this.redis.set(
      this.key(userId),
      JSON.stringify(session),
      'EX',
      this.TTL_SECONDS
    );
    return session;
  }

  async unassignTask(userId: string): Promise<SessionData> {
    const session = await this.getOrThrow(userId);
    if (!session.taskId) throw new Error('NO_TASK_ASSIGNED');

    session.taskId = undefined;
    await this.redis.set(
      this.key(userId),
      JSON.stringify(session),
      'EX',
      this.TTL_SECONDS
    );
    return session;
  }

  async addEvent(userId: string, event: Event): Promise<SessionData> {
    const session = await this.getOrThrow(userId);
    // Append event first
    session.events.push(event);
    // Only flip status on lifecycle events; avoid scanning entire history
    if (event.type === 'stopwatch') {
      const action = (event as { action: string }).action;
      if (action === 'start' && session.status === 'idle') {
        session.status = 'active';
      } else if (action === 'finish') {
        session.status = 'completed';
      }
    }
    await this.redis.set(
      this.key(userId),
      JSON.stringify(session),
      'EX',
      this.TTL_SECONDS
    );
    return session;
  }

  async complete(userId: string): Promise<SessionData> {
    const session = await this.getOrThrow(userId);
    await this.redis.set(
      this.key(userId),
      JSON.stringify(session),
      'EX',
      this.TTL_SECONDS
    );
    return session;
  }

  async cancel(userId: string): Promise<SessionData> {
    const session = await this.getOrThrow(userId);
    // No 'cancelled' status. Just delete session data.
    await this.redis.del(this.key(userId));
    return session;
  }

  async delete(userId: string): Promise<void> {
    await this.redis.del(this.key(userId));
  }

  private async getOrThrow(userId: string): Promise<SessionData> {
    const session = await this.get(userId);
    if (!session) throw new Error('NO_SESSION');
    return session;
  }
}

export const redisSessionService = new RedisSessionService();
