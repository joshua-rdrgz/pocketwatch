import * as authSchema from '@repo/shared/db/auth-schema';
import { getDb } from '@/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { oneTimeToken } from 'better-auth/plugins/one-time-token';

// Retrieve database instance
const db = getDb();

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      ...authSchema,
    },
  }),
  plugins: [oneTimeToken()],
  socialProviders: {
    google: {
      prompt: 'select_account',
      clientId: process.env.MY_API_GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.MY_API_GOOGLE_CLIENT_SECRET as string,
    },
  },
  trustedOrigins: ['chrome-extension://dhcinjkcmiibgibhapoalhbmkoalaoji'],
});
