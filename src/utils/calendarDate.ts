export type DateSelection = { mode: "live" } | { mode: "date"; date: string };
export const LIVE_SELECTION: DateSelection = { mode: "live" };
export const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timezone: string): Intl.DateTimeFormat {
  let result = formatters.get(timezone);
  if (!result) {
    result = new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", {
      timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
      weekday: "short", timeZoneName: "short",
    });
    if (formatters.size >= 128) formatters.delete(formatters.keys().next().value!);
    formatters.set(timezone, result);
  }
  return result;
}

function surrogate(year: number, month: number, day: number): Date {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

const keyOf = (date: Date): string =>
  `${String(date.getUTCFullYear()).padStart(4, "0")}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;

export function isCalendarDate(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const [year, month, day] = key.split("-").map(Number);
  return year >= 1 && keyOf(surrogate(year, month, day)) === key;
}

export function calendarSurrogate(key: string): Date {
  if (!isCalendarDate(key)) throw new RangeError("Invalid calendar date");
  const [year, month, day] = key.split("-").map(Number);
  return surrogate(year, month, day);
}

export function getZonedFields(instant: Date | number, timezone: string) {
  const epoch = instant instanceof Date ? instant.getTime() : instant;
  const parts = formatter(timezone).formatToParts(epoch);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)!.value;
  const year = Number(part("year"));
  const month = Number(part("month"));
  const day = Number(part("day"));
  const hour = Number(part("hour"));
  const minute = Number(part("minute"));
  const second = Number(part("second"));
  const localFields = surrogate(year, month, day);
  localFields.setUTCHours(hour, minute, second);
  return {
    date: keyOf(localFields), year, month, day, hour, minute, second,
    weekday: part("weekday"), abbreviation: part("timeZoneName"),
    offsetSeconds: (localFields.getTime() - Math.floor(epoch / 1000) * 1000) / 1000,
  };
}

export const addCalendarDays = (key: string, days: number): string => {
  const date = calendarSurrogate(key);
  date.setUTCDate(date.getUTCDate() + days);
  return keyOf(date);
};
export const calendarDifference = (later: string, earlier: string): number =>
  (calendarSurrogate(later).getTime() - calendarSurrogate(earlier).getTime()) / DAY_MS;
export const startOfCalendarMonth = (key: string): string => `${key.slice(0, 7)}-01`;
export function addCalendarMonths(key: string, months: number): string {
  const date = calendarSurrogate(startOfCalendarMonth(key));
  date.setUTCMonth(date.getUTCMonth() + months);
  return keyOf(date);
}
export function calendarMonthDays(key: string): string[] {
  const first = startOfCalendarMonth(key);
  const next = addCalendarMonths(first, 1);
  return Array.from({ length: calendarDifference(next, first) }, (_, i) => addCalendarDays(first, i));
}
export function formatCalendarDate(key: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(calendarSurrogate(key));
}

/** First local-date transition in a bracket; compare explicit-zone calendar keys. */
export function findDateTransition(before: number, after: number, timezone: string): number {
  const previousDate = getZonedFields(before, timezone).date;
  if (getZonedFields(after, timezone).date === previousDate) throw new RangeError("Date transition is not bracketed");
  let low = before;
  let high = after;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (getZonedFields(middle, timezone).date === previousDate) low = middle;
    else high = middle;
  }
  return high;
}

/** Bounded 72h search around the UTC calendar surrogate; no assumed local midnight. */
export function startOfCalendarDate(key: string, timezone: string): Date | null {
  const nominal = calendarSurrogate(key).getTime();
  const lower = nominal - 36 * HOUR_MS;
  const upper = nominal + 36 * HOUR_MS;
  let before = lower;
  for (let after = lower + HOUR_MS; after <= upper; after += HOUR_MS) {
    const beforeDate = getZonedFields(before, timezone).date;
    const afterDate = getZonedFields(after, timezone).date;
    if (beforeDate !== afterDate && afterDate >= key) {
      const boundary = findDateTransition(before, after, timezone);
      if (getZonedFields(boundary, timezone).date === key && getZonedFields(boundary - 1, timezone).date !== key) {
        return new Date(boundary);
      }
      if (afterDate > key) return null;
    }
    before = after;
  }
  return null;
}

export function resolveDateSelection(selection: DateSelection, now: Date, timezone: string) {
  const today = getZonedFields(now, timezone).date;
  const selected = selection.mode === "date" ? selection.date : today;
  const valid = isCalendarDate(selected);
  const start = selection.mode === "date" && valid && selected >= today ? startOfCalendarDate(selected, timezone) : null;
  const unavailable = selection.mode === "date" && valid && selected >= today && start === null;
  const isLive = selection.mode === "live" || !valid || selected < today || unavailable;
  return {
    isLive, today, selectedDate: isLive ? today : selected,
    offset: isLive ? 0 : calendarDifference(selected, today),
    instant: isLive ? now : start!, unavailable,
  };
}
