import { EventType } from '@/types/stopwatch';

export function formatTime(ms: number) {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / 60000) % 60;
  const hours = Math.floor(ms / 3600000);
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export const getEventColorByType = (type: EventType) => {
  switch (type) {
    case 'start':
    case 'resume':
      return 'border-blue-500';
    case 'break':
      return 'border-yellow-500';
    case 'finish':
      return 'border-red-500';
    default:
      return 'border-gray-300';
  }
};
