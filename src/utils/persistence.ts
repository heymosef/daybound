import { canonicalTimezone } from "./bundledTimezones";
import type { AppSettings, TimezoneConfig } from "./timezoneUtils";

export const DEFAULT_SETTINGS: AppSettings = {
  use24Hour: false,
  theme: "system",
  designTheme: "te-1",
  showBadge: true,
  showWeekends: false,
};

export type PersistenceStatus = "saved" | "unavailable";
export type PersistenceParser<T> = (value: unknown) => T;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function parseAppSettings(value: unknown): AppSettings {
  const settings = { ...DEFAULT_SETTINGS };
  if (!isRecord(value)) return settings;
  if (typeof value.use24Hour === "boolean") settings.use24Hour = value.use24Hour;
  if (typeof value.showBadge === "boolean") settings.showBadge = value.showBadge;
  if (typeof value.showWeekends === "boolean") settings.showWeekends = value.showWeekends;
  if (value.theme === "light" || value.theme === "dark" || value.theme === "system") {
    settings.theme = value.theme;
  }
  if (value.designTheme === "gamut" || value.designTheme === "te-1" || value.designTheme === "dos") {
    settings.designTheme = value.designTheme;
  }
  return settings;
}

// Retain valid rows even if an optional text field needs to be discarded.
const MAX_TEXT_LENGTH = 1024;
const optionalText = (value: unknown): string | undefined =>
  typeof value === "string" && value.length <= MAX_TEXT_LENGTH ? value : undefined;

function isTimezone(value: unknown): value is string {
  return typeof value === "string" && canonicalTimezone(value) !== undefined;
}

export function parseTimezoneConfig(value: unknown): TimezoneConfig[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  const timezones = new Set<string>();
  const rows: TimezoneConfig[] = [];
  for (const row of value) {
    if (!isRecord(row) || typeof row.id !== "string" || !row.id.trim() ||
      ids.has(row.id) || !isTimezone(row.timezone) || timezones.has(row.timezone)) continue;
    ids.add(row.id);
    timezones.add(row.timezone);
    const parsed: TimezoneConfig = { id: row.id, timezone: row.timezone, isHome: row.isHome === true };
    for (const field of ["label", "city", "country"] as const) {
      const text = optionalText(row[field]);
      if (text !== undefined) parsed[field] = text;
    }
    rows.push(parsed);
  }
  const homeIndex = Math.max(0, rows.findIndex((row) => row.isHome));
  return rows.map((row, index) => ({ ...row, isHome: index === homeIndex }));
}

export const parseNoticeDismissed = (value: unknown): boolean => value === true;

/** Read without mutating storage; recovery writes belong to the committed React effect. */
export function readPersistentValue<T>(key: string, initialValue: T, parse: PersistenceParser<T>): {
  value: T;
  status: PersistenceStatus;
  needsWrite: boolean;
  canPersist: boolean;
} {
  let saved: string | null;
  try {
    saved = window.localStorage.getItem(key);
  } catch {
    return { value: initialValue, status: "unavailable", needsWrite: false, canPersist: false };
  }
  let value: T;
  try {
    value = parse(saved === null ? undefined : JSON.parse(saved));
  } catch {
    value = initialValue;
  }
  return { value, status: "saved", needsWrite: saved !== JSON.stringify(value), canPersist: true };
}
