const KEY_PREFIX = 'halfdiary-daily-';

function todayKey(feature: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${KEY_PREFIX}${feature}-${date}`;
}

export function getDailyCount(feature: string): number {
  const val = localStorage.getItem(todayKey(feature));
  return val ? parseInt(val, 10) : 0;
}

export function incrementDailyCount(feature: string): number {
  const count = getDailyCount(feature) + 1;
  localStorage.setItem(todayKey(feature), String(count));
  return count;
}

export function canUseDaily(feature: string, limit: number): boolean {
  return getDailyCount(feature) < limit;
}

export function getRemainingDaily(feature: string, limit: number): number {
  return Math.max(0, limit - getDailyCount(feature));
}
