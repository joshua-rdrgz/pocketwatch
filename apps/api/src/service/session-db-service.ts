import { getDb } from '@/db';
import { workSession, workSessionEvent } from '@repo/shared/db/schema';
import type { Event, SessionData } from '@repo/shared/types/session';

type StopwatchAction = 'start' | 'break' | 'resume' | 'finish';

class SessionDbService {
  private validateAndExtractActiveWindow(
    events: Event<'stopwatch' | 'browser'>[]
  ): {
    startTime: Date;
    endTime: Date;
    sortedEvents: Event<'stopwatch' | 'browser'>[];
  } {
    if (!events || events.length === 0) {
      throw new Error('No events to persist');
    }

    const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

    const first = sortedEvents[0]!;
    const last = sortedEvents[sortedEvents.length - 1]!;

    // Global boundaries: must start with stopwatch start and end with stopwatch finish
    if (!(first.type === 'stopwatch' && first.action === 'start')) {
      throw new Error('First event must be stopwatch start');
    }
    if (!(last.type === 'stopwatch' && last.action === 'finish')) {
      throw new Error('Last event must be stopwatch finish');
    }

    const startTime = new Date(first.timestamp);
    const endTime = new Date(last.timestamp);

    // Stopwatch sequence validation (uses already-sorted order)
    const stopwatchEvents = sortedEvents.filter((e) => e.type === 'stopwatch');
    let isOnBreak = false;
    for (let i = 1; i < stopwatchEvents.length - 1; i++) {
      const action = stopwatchEvents[i]!.action as StopwatchAction;
      if (action === 'start') {
        throw new Error("Unexpected 'start' after initial start");
      }
      if (action === 'break') {
        if (isOnBreak) {
          throw new Error("Consecutive 'break' without 'resume'");
        }
        isOnBreak = true;
      } else if (action === 'resume') {
        if (!isOnBreak) {
          throw new Error("'resume' without a preceding 'break'");
        }
        isOnBreak = false;
      } else if (action === 'finish') {
        throw new Error("'finish' can only appear as the last event");
      }
    }
    if (isOnBreak) {
      throw new Error(
        "Cannot 'finish' while on break. 'resume' is required before 'finish'"
      );
    }

    // Browser events must be within active window
    const startMs = startTime.getTime();
    const endMs = endTime.getTime();
    for (const ev of sortedEvents) {
      if (ev.type !== 'browser') continue;
      if (ev.timestamp < startMs || ev.timestamp > endMs) {
        throw new Error('Browser events must occur between start and finish');
      }
    }

    return { startTime, endTime, sortedEvents };
  }

  async persistCompletedSession(sessionData: SessionData): Promise<void> {
    const { startTime, endTime, sortedEvents } =
      this.validateAndExtractActiveWindow(sessionData.events);

    const db = getDb();
    const assuredUserId = sessionData.userId;

    await db.transaction(async (tx) => {
      const [newSession] = await tx
        .insert(workSession)
        .values({
          userId: assuredUserId,
          startTime,
          endTime,
        })
        .returning();

      if (!newSession) throw new Error('Failed to create session record');

      if (sortedEvents.length > 0) {
        await tx.insert(workSessionEvent).values(
          sortedEvents.map((event) => ({
            sessionId: newSession.id,
            type: event.type,
            action: event.action,
            timestamp: new Date(event.timestamp),
            payload:
              'payload' in event
                ? (event as { payload: unknown }).payload
                : null,
          }))
        );
      }
    });
  }
}

export const sessionDbService = new SessionDbService();
