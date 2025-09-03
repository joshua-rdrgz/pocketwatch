import { z } from 'zod';

export const dashInfoSchema = z.object({
  name: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  isMonetized: z.boolean(),
  hourlyRate: z.number().optional(),
});
export type DashInfo = z.infer<typeof dashInfoSchema>;
