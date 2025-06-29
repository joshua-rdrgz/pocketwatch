import { z } from 'zod';

const envSchema = z.object({
  API_BASE_URL: z.string().url(),
});

export const env = envSchema.parse({
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
});
