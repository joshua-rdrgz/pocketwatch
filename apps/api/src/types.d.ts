declare global {
  namespace Express {
    interface Request {
      user:
        | {
            id: string;
            name: string;
            email: string;
            emailVerified: boolean;
            image: string | null | undefined;
            createdAt: Date;
            updatedAt: Date;
          }
        | undefined;
      session:
        | {
            id: string;
            expiresAt: Date;
            token: string;
            createdAt: Date;
            updatedAt: Date;
            ipAddress: string | null | undefined;
            userAgent?: string;
            userId: string;
          }
        | undefined;
    }
  }
}

export {};
