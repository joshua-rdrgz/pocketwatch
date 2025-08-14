import { Event } from '@repo/shared/types/session';
import Redis from 'ioredis';

interface SessionData {
  sessionId: string;
  userId: string;
  startTime: number;
  status: 'active' | 'completed' | 'cancelled';
  events: Event[];
}

export class RedisService {
  private redis: Redis;
  private readonly SESSION_TTL = 86400; // 24 hours in seconds
  private readonly SESSION_PREFIX = 'session:';

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redis.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.redis.on('connect', () => {
      console.log('Redis Client Connected');
    });
  }

  /**
   * Start a new session
   */
  async startSession(sessionId: string, userId: string): Promise<void> {
    const sessionKey = this.getSessionKey(sessionId);

    const sessionData: SessionData = {
      sessionId,
      userId,
      startTime: Date.now(),
      status: 'active',
      events: [],
    };

    // Store entire session as JSON string
    await this.redis.set(
      sessionKey,
      JSON.stringify(sessionData),
      'EX',
      this.SESSION_TTL
    );
  }

  /**
   * Add an event to a session
   */
  async addEvent(sessionId: string, event: Event): Promise<void> {
    const sessionKey = this.getSessionKey(sessionId);

    // Get current session data
    const sessionData = await this.getSession(sessionId);
    if (!sessionData) {
      throw new Error('Session not found');
    }

    // Add event
    sessionData.events.push(event);

    // Save updated session
    await this.redis.set(
      sessionKey,
      JSON.stringify(sessionData),
      'EX',
      this.SESSION_TTL
    );
  }

  /**
   * Get full session data
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const sessionKey = this.getSessionKey(sessionId);

    const data = await this.redis.get(sessionKey);
    if (!data) return null;

    return JSON.parse(data) as SessionData;
  }

  /**
   * Get all events for a session
   */
  async getSessionEvents(sessionId: string): Promise<Event[]> {
    const session = await this.getSession(sessionId);
    return session?.events || [];
  }

  /**
   * Get session metadata (without events)
   */
  async getSessionMetadata(sessionId: string): Promise<{
    userId: string;
    startTime: number;
    status: string;
  } | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    return {
      userId: session.userId,
      startTime: session.startTime,
      status: session.status,
    };
  }

  /**
   * Complete a session and return all data
   */
  async completeSession(sessionId: string): Promise<{
    metadata: Omit<SessionData, 'events'>;
    events: Event[];
  } | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    // Update status
    session.status = 'completed';

    // Save updated session
    const sessionKey = this.getSessionKey(sessionId);
    await this.redis.set(
      sessionKey,
      JSON.stringify(session),
      'EX',
      this.SESSION_TTL
    );

    // Return data
    const { events, ...metadata } = session;
    return { metadata, events };
  }

  /**
   * Update session status
   */
  async updateSessionStatus(
    sessionId: string,
    status: 'active' | 'completed' | 'cancelled'
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.status = status;

    const sessionKey = this.getSessionKey(sessionId);
    await this.redis.set(
      sessionKey,
      JSON.stringify(session),
      'EX',
      this.SESSION_TTL
    );
  }

  /**
   * Delete session data from Redis
   */
  async deleteSession(sessionId: string): Promise<void> {
    const sessionKey = this.getSessionKey(sessionId);
    await this.redis.del(sessionKey);
  }

  /**
   * Check if a session exists
   */
  async sessionExists(sessionId: string): Promise<boolean> {
    const sessionKey = this.getSessionKey(sessionId);
    return (await this.redis.exists(sessionKey)) === 1;
  }

  /**
   * Get multiple sessions for a user (useful for dashboard/history)
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    // This requires maintaining a separate index, which could be done with Redis sets
    // For now, this is a placeholder that would need implementation based on your needs
    // You might want to scan keys or maintain a user->sessions index
    const keys = await this.redis.keys(`${this.SESSION_PREFIX}*`);
    const sessions: SessionData[] = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const session = JSON.parse(data) as SessionData;
        if (session.userId === userId) {
          sessions.push(session);
        }
      }
    }

    return sessions;
  }

  /**
   * Get session statistics (event count, duration, etc.)
   */
  async getSessionStats(sessionId: string): Promise<{
    eventCount: number;
    duration: number;
    lastEventTime: number | null;
  } | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    const lastEvent = session.events[session.events.length - 1];
    const lastEventTime = lastEvent?.timestamp || null;

    return {
      eventCount: session.events.length,
      duration: lastEventTime ? lastEventTime - session.startTime : 0,
      lastEventTime,
    };
  }

  private getSessionKey(sessionId: string): string {
    return `${this.SESSION_PREFIX}${sessionId}`;
  }

  /**
   * Cleanup method
   */
  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}

// Export singleton instance
export const redisService = new RedisService();
