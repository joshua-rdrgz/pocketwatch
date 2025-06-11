declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
        image?: string;
        createdAt: Date;
        updatedAt: Date;
      };
      session?: {
        id: string;
        expiresAt: Date;
        token: string;
        createdAt: Date;
        updatedAt: Date;
        ipAddress?: string;
        userAgent?: string;
        userId: string;
      };
    }
  }
}

declare module 'xss-clean';
