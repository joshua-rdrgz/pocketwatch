import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: ['./src/db/schema-OLD.ts', './src/db/auth-schema-OLD.ts'],
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.MY_API_DATABASE_URL!,
  },
});
