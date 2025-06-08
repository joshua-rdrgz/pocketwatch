import { requireUserSession, retrieveUserSession } from '@/middleware/auth.js';
import { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { Mock, vi } from 'vitest';
import { createApp } from '../src/app.js';

// Create mock function using vi.hoisted
const mockGetSession = vi.hoisted(() => vi.fn());

// Mock the auth module
vi.mock('@/lib/auth.js', () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

// Type definitions for our mocks
interface MockUser {
  id: string;
  name: string;
  email: string;
}

interface MockSession {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
}

interface MockRequest extends Partial<Request> {
  headers: Record<string, string>;
  user?: MockUser;
  session?: MockSession;
}

interface MockResponse extends Partial<Response> {
  status: Mock;
  json: Mock;
}

describe('Protected Routes', () => {
  const app = createApp();

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  // ============================================================================
  // REUSABLE AUTH STATE SETUP FUNCTIONS
  // ============================================================================

  /**
   * Mock a valid authenticated user with active session
   */
  const mockValidAuth = () => {
    const mockUser: MockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    };
    const mockSession: MockSession = {
      id: 'session-123',
      token: 'valid-token',
      userId: 'user-123',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    };

    mockGetSession.mockResolvedValue({
      user: mockUser,
      session: mockSession,
    });

    return { mockUser, mockSession };
  };

  /**
   * Mock no authentication (no user, no session)
   */
  const mockNoAuth = () => {
    mockGetSession.mockResolvedValue(null);
  };

  /**
   * Mock user exists but no active session
   */
  const mockUserNoSession = () => {
    const mockUser: MockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    };

    mockGetSession.mockResolvedValue({
      user: mockUser,
      session: null,
    });

    return { mockUser };
  };

  /**
   * Mock expired session
   */
  const mockExpiredSession = () => {
    const mockUser: MockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    };
    const mockSession: MockSession = {
      id: 'session-123',
      token: 'expired-token',
      userId: 'user-123',
      expiresAt: new Date(Date.now() - 1000), // expired 1 second ago
    };

    mockGetSession.mockResolvedValue({
      user: mockUser,
      session: mockSession,
    });

    return { mockUser, mockSession };
  };

  /**
   * Mock invalid session (throws error)
   */
  const mockInvalidSession = () => {
    mockGetSession.mockRejectedValue(new Error('Invalid session'));
  };

  // ============================================================================
  // MIDDLEWARE UNIT TESTS - Test middleware functions directly
  // ============================================================================

  describe('retrieveUserSession middleware', () => {
    it('should add User and Session to request object when valid auth token provided', async () => {
      const { mockUser, mockSession } = mockValidAuth();

      // Create mock request and response objects
      const mockReq = {
        headers: {
          cookie: `better-auth.session_token=${mockSession.token}`,
          'user-agent': 'test-agent',
        },
        user: undefined,
        session: undefined,
      } as MockRequest & Request;

      const mockRes = {} as Response;
      const mockNext: NextFunction = vi.fn();

      // Call middleware directly
      await retrieveUserSession(mockReq, mockRes, mockNext);

      // Verify auth was called with request headers
      expect(mockGetSession).toHaveBeenCalledWith({
        headers: mockReq.headers,
      });

      // Verify user and session were added to request
      expect(mockReq.user).toEqual(mockUser);
      expect(mockReq.session).toEqual(mockSession);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should not add User/Session to request when no User exists', async () => {
      mockNoAuth();

      const mockReq = {
        headers: {
          'user-agent': 'test-agent',
        },
        user: undefined,
        session: undefined,
      } as MockRequest & Request;

      const mockRes = {} as Response;
      const mockNext: NextFunction = vi.fn();

      await retrieveUserSession(mockReq, mockRes, mockNext);

      expect(mockGetSession).toHaveBeenCalledWith({
        headers: mockReq.headers,
      });

      // Should not have added user/session to request
      expect(mockReq.user).toBeUndefined();
      expect(mockReq.session).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should not add Session to request when no Session exists', async () => {
      const { mockUser } = mockUserNoSession();

      const mockReq = {
        headers: {
          cookie: 'better-auth.session_token=some-token',
          'user-agent': 'test-agent',
        },
        user: undefined,
        session: undefined,
      } as MockRequest & Request;

      const mockRes = {} as Response;
      const mockNext: NextFunction = vi.fn();

      await retrieveUserSession(mockReq, mockRes, mockNext);

      expect(mockGetSession).toHaveBeenCalledWith({
        headers: mockReq.headers,
      });

      // Should have added user but not session
      expect(mockReq.user).toEqual(mockUser);
      expect(mockReq.session).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without error when invalid Session provided', async () => {
      mockInvalidSession();

      const mockReq = {
        headers: {
          cookie: 'better-auth.session_token=invalid-token',
          'user-agent': 'test-agent',
        },
        user: undefined,
        session: undefined,
      } as MockRequest & Request;

      const mockRes = {} as Response;
      const mockNext: NextFunction = vi.fn();

      await retrieveUserSession(mockReq, mockRes, mockNext);

      expect(mockGetSession).toHaveBeenCalledWith({
        headers: mockReq.headers,
      });

      // Should not have added user/session due to error
      expect(mockReq.user).toBeUndefined();
      expect(mockReq.session).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('requireUserSession middleware', () => {
    it('should call next() when User and valid Session exist in request object', async () => {
      const { mockUser, mockSession } = mockValidAuth();

      const mockReq = {
        user: mockUser,
        session: mockSession,
      } as MockRequest & Request;

      const mockRes = {} as Response;
      const mockNext: NextFunction = vi.fn();

      await requireUserSession(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should return 401 when no User in request object', async () => {
      const mockReq = {
        user: undefined,
        session: undefined,
      } as MockRequest & Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as MockResponse & Response;
      const mockNext: NextFunction = vi.fn();

      await requireUserSession(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringMatching(/unauthorized/i),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when no Session in request object', async () => {
      const { mockUser } = mockUserNoSession();

      const mockReq = {
        user: mockUser,
        session: undefined,
      } as MockRequest & Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as MockResponse & Response;
      const mockNext: NextFunction = vi.fn();

      await requireUserSession(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringMatching(/unauthorized/i),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when Session is expired', async () => {
      const { mockUser, mockSession } = mockExpiredSession();

      const mockReq = {
        user: mockUser,
        session: mockSession,
      } as MockRequest & Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as MockResponse & Response;
      const mockNext: NextFunction = vi.fn();

      await requireUserSession(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringMatching(/unauthorized/i),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // INTEGRATION TESTS - Test actual routes with middleware applied
  // ============================================================================

  describe('Health endpoint authentication status', () => {
    it('should return authenticated: true with User and Session info when authenticated', async () => {
      const { mockUser, mockSession } = mockValidAuth();

      const response = await request(app).get('/api/health').expect(200);

      expect(response.body).toEqual({
        status: 'OK',
        message: 'Welcome to the Pocketwatch API!',
        authenticated: true,
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
        },
        session: {
          id: mockSession.id,
          token: mockSession.token,
          expiresAt: mockSession.expiresAt.toISOString(),
        },
      });
    });

    it('should return authenticated: false when not authenticated', async () => {
      mockNoAuth();

      const response = await request(app).get('/api/health').expect(200);

      expect(response.body).toEqual({
        status: 'OK',
        message: 'Welcome to the Pocketwatch API!',
        authenticated: false,
      });
    });
  });

  describe('Protected demo route', () => {
    it('should return 401 when no User and Session', async () => {
      mockNoAuth();

      const response = await request(app).get('/api/protected').expect(401);

      expect(mockGetSession).toHaveBeenCalled();
      expect(response.status).toBe(401);
      expect(JSON.stringify(response.body).toLowerCase()).toContain(
        'unauthorized'
      );
    });

    it('should return full User and Session information when authenticated', async () => {
      const { mockUser, mockSession } = mockValidAuth();

      const response = await request(app).get('/api/protected').expect(200);

      expect(response.body).toEqual({
        user: mockUser,
        session: {
          ...mockSession,
          expiresAt: mockSession.expiresAt.toISOString(),
        },
      });
    });
  });
});
