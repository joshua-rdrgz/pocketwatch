import request from 'supertest';
import { createApp } from '../src/app';
import { retrieveUserSession } from '@/middleware/auth';
import { vi } from 'vitest';

// Mock the auth middleware
vi.mock('@/middleware/auth.js', () => ({
  retrieveUserSession: vi.fn((req, res, next) => next()),
  requireUserSession: vi.fn((req, res, next) => next()),
}));

describe('API Endpoints', () => {
  const app = createApp();

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  describe('GET /api/health', () => {
    test('should return health status OK', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.message).toBe(
        'Welcome to the Pocketwatch API!'
      );
    });
  });

  describe('Non-existent routes', () => {
    test('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
    });

    describe('Middleware Order - retrieveUserSession runs on all /api routes', () => {
      test('should call retrieveUserSession middleware on ALL /api routes', async () => {
        await request(app).get('/api/health');

        expect(retrieveUserSession).toHaveBeenCalledWith(
          expect.any(Object), // req
          expect.any(Object), // res
          expect.any(Function) // next
        );
      });

      test('should call retrieveUserSession middleware on unknown /api routes (before 404)', async () => {
        await request(app).get('/api/unknown-endpoint');

        expect(retrieveUserSession).toHaveBeenCalledWith(
          expect.any(Object), // req
          expect.any(Object), // res
          expect.any(Function) // next
        );
      });

      test('should call retrieveUserSession middleware on error-throwing /api routes', async () => {
        await request(app).get('/api/health?error=true');

        expect(retrieveUserSession).toHaveBeenCalledWith(
          expect.any(Object), // req
          expect.any(Object), // res
          expect.any(Function) // next
        );
      });

      test('should NOT call retrieveUserSession on non-/api routes', async () => {
        await request(app).get('/some-other-route');

        // Should not have been called because route is outside /api
        expect(retrieveUserSession).not.toHaveBeenCalled();
      });

      test('should call retrieveUserSession middleware exactly once per /api request', async () => {
        await request(app).get('/api/health');

        expect(retrieveUserSession).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Failing requests', () => {
    describe('Development environment', () => {
      test('should return 500 for internal server errors with full error details', async () => {
        // Use the health endpoint with error=true to trigger an error
        const response = await request(app).get('/api/health?error=true');

        expect(response.status).toBe(500);
        expect(response.body.status).toBe('error');
        expect(response.body.error).toMatchObject({
          message: expect.stringMatching(/error thrown for testing/i),
          isOperational: true,
          stack: expect.any(String),
        });
      });
    });

    describe('Production environment', () => {
      beforeEach(() => {
        // Set NODE_ENV to production for these tests
        process.env.NODE_ENV = 'production';
      });

      afterEach(() => {
        // Restore NODE_ENV back to development (the global default)
        process.env.NODE_ENV = 'development';
      });

      test('should not expose error details in production', async () => {
        // Use the health endpoint with error=true to trigger an error
        const response = await request(app).get('/api/health?error=true');

        expect(response.status).toBe(500);
        expect(response.body.status).toBe('error');
        expect(response.body.error).toMatchObject({
          message: expect.stringMatching(/error thrown for testing/i),
        });
        expect(response.body.error).not.toHaveProperty('stack');
        expect(response.body.error).not.toHaveProperty('isOperational');
      });
    });
  });
});
