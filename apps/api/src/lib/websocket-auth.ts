/* eslint-disable @typescript-eslint/no-explicit-any */
import { AuthedReq } from '@/types/server';
import type { Server } from 'http';
import { Duplex } from 'stream';
import { auth } from './auth';

export function establishWebSocketAuthUpgrade(httpServer: Server) {
  // Get reference to original emit method
  const originalEmit = httpServer.emit.bind(httpServer);

  // Override the emit method to intercept upgrade events
  httpServer.emit = function (event: string, ...args: any[]) {
    if (event === 'upgrade') {
      const [req, socket, head] = args;

      // Handle authentication asynchronously
      handleAuthThenUpgrade(req, socket, head, originalEmit);

      // Don't call the original emit for upgrade events
      return true;
    }

    // For all other events, use original emit
    return originalEmit(event, ...args);
  } as any;
}

async function handleAuthThenUpgrade(
  req: AuthedReq,
  socket: Duplex,
  head: Buffer,
  originalEmit: any
) {
  try {
    console.log('Attempting to Upgrade....');

    // Parse URL to get query parameters
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      console.log('No token provided in WebSocket upgrade request');
      socket.write(
        'HTTP/1.1 401 Unauthorized\r\n' + 'Connection: close\r\n' + '\r\n'
      );
      socket.destroy();
      return;
    }

    // Verify the one-time token
    const data = await auth.api.verifyOneTimeToken({
      body: { token },
    });

    console.log('Token verification result: ', data);

    if (!data?.user || !data?.session) {
      socket.write(
        'HTTP/1.1 401 Unauthorized\r\n' + 'Connection: close\r\n' + '\r\n'
      );
      socket.destroy();
      return;
    }

    if (
      data.session.expiresAt &&
      new Date(data.session.expiresAt) < new Date()
    ) {
      socket.write(
        'HTTP/1.1 401 Unauthorized\r\n' + 'Connection: close\r\n' + '\r\n'
      );
      socket.destroy();
      return;
    }

    // Authentication passed - attach session and continue with upgrade
    (req as AuthedReq).authSession = data;
    originalEmit('upgrade', req, socket, head);
  } catch (error) {
    console.error('WebSocket upgrade authentication failed: ', error);
    socket.write(
      'HTTP/1.1 500 Internal Server Error\r\n' +
        'Connection: close\r\n' +
        '\r\n'
    );
    socket.destroy();
  }
}
