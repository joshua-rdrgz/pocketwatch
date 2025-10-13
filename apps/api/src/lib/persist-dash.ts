import { getDb } from '@/db';
import { dash, dashEvent } from '@repo/shared/db/schema';
import type { DashData } from '@repo/shared/types/dash';
import { validateAndSortDashEvents } from '@repo/shared/lib/dash-validation';

export async function persistCompletedDash(dashData: DashData): Promise<void> {
  const sortedEvents = validateAndSortDashEvents(dashData.events);
  const db = getDb();

  await db.transaction(async (tx) => {
    const [newDash] = await tx
      .insert(dash)
      .values({
        userId: dashData.userId,
        ...(dashData.metadata && {
          name: dashData.metadata.name || null,
          category: dashData.metadata.category || null,
          notes: dashData.metadata.notes || null,
          isMonetized: dashData.metadata.isMonetized || false,
          hourlyRate: dashData.metadata.hourlyRate?.toString() || '0.00',
        }),
      })
      .returning();

    if (!newDash) throw new Error('Failed to create dash record');

    if (sortedEvents.length > 0) {
      await tx.insert(dashEvent).values(
        sortedEvents.map((event) => ({
          dashId: newDash.id,
          action: event.action,
          timestamp: new Date(event.timestamp),
          payload: null,
        }))
      );
    }
  });
}
