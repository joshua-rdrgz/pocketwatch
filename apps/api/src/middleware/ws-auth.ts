import { auth } from '@/lib/auth';
import type { Request } from 'express';
import type WebSocket from 'ws';

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  sessionId?: string;
}

export async function authenticateWebSocket(
  req: Request
): Promise<{ userId: string; sessionId: string } | null> {
  try {
    // Get session from betterauth using the request headers
    const session = await auth.api.getSession({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      headers: req.headers as any,
    });

    if (!session?.user || !session?.session) {
      return null;
    }

    // Check if session is expired
    if (
      session.session.expiresAt &&
      new Date(session.session.expiresAt) < new Date()
    ) {
      return null;
    }

    return {
      userId: session.user.id,
      sessionId: session.session.id,
    };
  } catch (error) {
    console.error('WebSocket authentication failed:', error);
    return null;
  }
}
