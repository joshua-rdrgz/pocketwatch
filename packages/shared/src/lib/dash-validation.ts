import { DashEvent, DashEventAction } from '../types/dash';

export function validateAndSortDashEvents(events: DashEvent[]): DashEvent[] {
  if (!events || events.length === 0) {
    throw new Error('No events to validate');
  }

  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

  const first = sortedEvents[0]!;
  const last = sortedEvents[sortedEvents.length - 1]!;

  if (first.action !== 'start') {
    throw new Error('First event must be start');
  }
  if (last.action !== 'finish') {
    throw new Error('Last event must be finish');
  }

  let isOnBreak = false;
  for (let i = 1; i < sortedEvents.length - 1; i++) {
    const action = sortedEvents[i]!.action as DashEventAction;
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

  return sortedEvents;
}
