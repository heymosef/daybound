import { findDateTransition, formatCalendarDate, getZonedFields, HOUR_MS } from "./calendarDate";

export const TOTAL_HOURS = 25;
export const CENTER_INDEX = 12;
type ZonedFields = ReturnType<typeof getZonedFields>;

export function formatClock(fields: ZonedFields, use24Hour: boolean, alwaysMinutes = true, pad24 = false): string {
  const hour = use24Hour ? fields.hour : fields.hour % 12 || 12;
  const hourText = pad24 && use24Hour ? String(hour).padStart(2, "0") : String(hour);
  const minutes = alwaysMinutes || fields.minute !== 0 ? `:${String(fields.minute).padStart(2, "0")}` : "";
  return `${hourText}${minutes}`;
}
export const dayPeriod = (fields: ZonedFields): string => fields.hour < 12 ? "AM" : "PM";
export function formatZonedClock(instant: Date, timezone: string, use24Hour: boolean, pad24 = true): string {
  const fields = getZonedFields(instant, timezone);
  return `${formatClock(fields, use24Hour, true, pad24)}${use24Hour ? "" : ` ${dayPeriod(fields)}`}`;
}
export function formatOffset(offsetSeconds: number): string {
  const absolute = Math.abs(offsetSeconds);
  const hours = String(Math.floor(absolute / 3600)).padStart(2, "0");
  const minutes = String(Math.floor(absolute % 3600 / 60)).padStart(2, "0");
  const seconds = absolute % 60;
  return `UTC${offsetSeconds < 0 ? "-" : "+"}${hours}:${minutes}${seconds ? `:${String(seconds).padStart(2, "0")}` : ""}`;
}

export function createTimeline(instant: Date, timezone: string, isLive: boolean, use24Hour = false) {
  const epoch = instant.getTime();
  const anchor = isLive ? Math.floor(epoch / HOUR_MS) * HOUR_MS : epoch;
  const start = isLive ? anchor - CENTER_INDEX * HOUR_MS : anchor;
  const end = start + TOTAL_HOURS * HOUR_MS;
  const progress = isLive ? CENTER_INDEX + (epoch - anchor) / HOUR_MS : 0;
  const cells = Array.from({ length: TOTAL_HOURS }, (_, index) => {
    const time = start + index * HOUR_MS;
    const fields = getZonedFields(time, timezone);
    return {
      index, time, fields,
      label: formatClock(fields, use24Hour, false), period: dayPeriod(fields).toLowerCase(),
      isNight: fields.hour < 7 || fields.hour >= 19,
      isWeekend: fields.weekday === "Sat" || fields.weekday === "Sun",
      description: `${fields.date} ${formatClock(fields, true)} ${formatOffset(fields.offsetSeconds)} (${new Date(time).toISOString()})`,
    };
  });

  const boundaryAt = (time: number) => {
    const fields = getZonedFields(time, timezone);
    return {
      time, index: (time - start) / HOUR_MS, date: fields.date,
      label: formatCalendarDate(fields.date, { weekday: "short", month: "short", day: "numeric" }),
      key: `${fields.date}-${time}`,
    };
  };
  const boundaries: ReturnType<typeof boundaryAt>[] = [];
  if (getZonedFields(start - 1, timezone).date !== cells[0].fields.date) boundaries.push(boundaryAt(start));
  // Bracket transitions throughout the half-open rail, including inside the final cell.
  const step = HOUR_MS / 4;
  for (let before = start; before < end; before += step) {
    const after = Math.min(before + step, end);
    if (getZonedFields(before, timezone).date !== getZonedFields(after, timezone).date) {
      const time = findDateTransition(before, after, timezone);
      if (time < end) boundaries.push(boundaryAt(time));
    }
  }
  const segments = [boundaryAt(start), ...boundaries.filter((boundary) => boundary.time > start)];
  return { start, end, anchor, progress, cells, boundaries, segments };
}
