import { Task } from '@repo/shared/types/db';

export function formatTime(ms: number) {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / 60000) % 60;
  const hours = Math.floor(ms / 3600000);
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function formatCurrentDate(date?: Date) {
  const currDate = date || new Date();

  const formattedDate = currDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const suffix = getSuffixFromDay(currDate.getDate());

  return formattedDate.concat(suffix);
}

function getSuffixFromDay(day: number): string {
  const suffixArr = ['th', 'st', 'nd', 'rd'];

  const lastDigit = day % 10;
  const lastTwoDigits = day % 100;
  const isTeen = lastTwoDigits >= 11 && lastTwoDigits <= 13;

  const suffixIndex = isTeen ? 0 : lastDigit > 3 ? 0 : lastDigit;

  return suffixArr[suffixIndex];
}

export const getStatusColor = (status: Task['status']) => {
  switch (status) {
    case 'complete':
      return 'bg-green-100 text-green-800 hover:bg-green-100';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
    case 'not_started':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  }
};

export const formatStatus = (status: Task['status']) => {
  return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};
