// src/utils/formatTime.ts
export function formatTime(timeStr: string | null): string {
  if (!timeStr) return '';
  // timeStr format: "10:30:00" or "10:30:00+00" from PostgreSQL TIME type
  const match = timeStr.match(/^(\\d{1,2}):(\\d{2})/);
  if (!match) return timeStr;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}