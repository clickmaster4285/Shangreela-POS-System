/** Consistent date/time display for orders and bills (Pakistan locale). */
const LOCALE = 'en-PK';

export function formatOrderDateTime(iso: string | undefined | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export type CalendarDayGroup<T extends { createdAt: string }> = {
  dayKey: string;
  dayLabel: string;
  orders: T[];
};

/** Newest day first; within each day, orders newest first. */
export function groupOrdersByCalendarDay<T extends { createdAt: string }>(orders: T[]): CalendarDayGroup<T>[] {
  const sorted = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const map = new Map<string, T[]>();
  for (const o of sorted) {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(o);
  }
  const keys = [...map.keys()].sort((a, b) => b.localeCompare(a));
  return keys.map((dayKey) => {
    const [y, m, da] = dayKey.split('-').map(Number);
    const label = new Date(y, m - 1, da).toLocaleDateString(LOCALE, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return { dayKey, dayLabel: label, orders: map.get(dayKey)! };
  });
}
