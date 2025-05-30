import * as authSchema from '@/db/auth-schema.js';
import { db } from '@/db/index.js';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      ...authSchema,
    },
  }),
  socialProviders: {
    google: {
      prompt: 'select_account',
      clientId: process.env.MY_API_GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.MY_API_GOOGLE_CLIENT_SECRET as string,
    },
  },
  trustedOrigins: ['chrome-extension://dhcinjkcmiibgibhapoalhbmkoalaoji'],
});
