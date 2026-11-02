import metadata from "./timezoneAliases.json";
import provenance from "../../docs/timezone-provenance.json";
import { ZoneId } from "@js-joda/core";
import { canonicalTimezone, getTimezoneNames, TIMEZONE_DATA_VERSION } from "./bundledTimezones";
import { getZonedFields, startOfCalendarDate, timezoneTransitions } from "./calendarDate";

it("bundles the current reviewed IANA version and resolves legacy names", () => {
  expect(TIMEZONE_DATA_VERSION).toBe(provenance.version);
  expect(canonicalTimezone("Canada/Pacific")).toBe("America/Vancouver");
  expect(canonicalTimezone("US/Pacific")).toBe("America/Los_Angeles");
  expect(canonicalTimezone("utc")).toBe("UTC");
  expect(canonicalTimezone("Not/A_Zone")).toBeUndefined();
  expect(getTimezoneNames()).toEqual(expect.arrayContaining(["America/Vancouver", "Africa/Kampala", "Asia/Kolkata"]));
});
it.each([
  ["2026-11-01T08:59:59Z", "America/Vancouver", "2026-11-01", 1, 59, -25200, "PCT"],
  ["2026-11-01T09:00:00Z", "America/Vancouver", "2026-11-01", 2, 0, -25200, "PCT"],
  ["2027-01-15T12:00:00Z", "Canada/Pacific", "2027-01-15", 5, 0, -25200, "PCT"],
  ["2027-01-15T12:00:00Z", "America/Los_Angeles", "2027-01-15", 4, 0, -28800, "PST"],
  ["2027-01-15T12:00:00Z", "America/Dawson_Creek", "2027-01-15", 5, 0, -25200, "MST"],
  ["2025-12-15T12:00:00Z", "America/Vancouver", "2025-12-15", 4, 0, -28800, "PST"],
  ["2026-09-16T12:00:00Z", "America/Vancouver", "2026-09-16", 5, 0, -25200, "PDT"],
  ["2026-11-01T05:59:59Z", "America/Edmonton", "2026-10-31", 23, 59, -21600, "MDT"],
  ["2026-11-01T06:00:00Z", "America/Edmonton", "2026-11-01", 0, 0, -21600, "ABT"],
  ["2026-11-01T07:59:59Z", "America/Edmonton", "2026-11-01", 1, 59, -21600, "ABT"],
  ["2026-11-01T08:00:00Z", "America/Edmonton", "2026-11-01", 2, 0, -21600, "ABT"],
  ["2026-11-02T12:00:00Z", "America/Edmonton", "2026-11-02", 6, 0, -21600, "ABT"],
  ["2027-01-15T12:00:00Z", "Canada/Mountain", "2027-01-15", 6, 0, -21600, "ABT"],
  ["2027-07-15T12:00:00Z", "america/edmonton", "2027-07-15", 6, 0, -21600, "ABT"],
  ["2025-12-15T12:00:00Z", "Canada/Mountain", "2025-12-15", 5, 0, -25200, "MST"],
  ["2026-11-02T12:00:00Z", "America/Yellowknife", "2026-11-02", 6, 0, -21600, "CST"],
  ["2027-01-15T12:00:00Z", "America/Regina", "2027-01-15", 6, 0, -21600, "CST"],
  ["2027-01-15T12:00:00Z", "America/Denver", "2027-01-15", 5, 0, -25200, "MST"],
  ["2026-11-02T12:00:00Z", "America/Winnipeg", "2026-11-02", 7, 0, -18000, "MBT"],
  ["2026-11-02T12:00:00Z", "America/Inuvik", "2026-11-02", 6, 0, -21600, "CST"],
  ["2026-11-01T04:59:59Z", "America/Havana", "2026-11-01", 0, 59, -14400, "CDT"],
  ["2026-11-01T05:00:00Z", "America/Havana", "2026-11-01", 1, 0, -14400, "CDT"],
  ["2027-01-15T12:00:00Z", "Cuba", "2027-01-15", 8, 0, -14400, "CDT"],
  ["2027-11-07T04:59:59Z", "America/Havana", "2027-11-07", 0, 59, -14400, "CDT"],
  ["2027-11-07T05:00:00Z", "America/Havana", "2027-11-07", 0, 0, -18000, "CST"],
  ["1965-04-01T01:59:59Z", "America/Sao_Paulo", "1965-03-31", 23, 59, -7200, "UTC-02:00"],
  ["1965-04-01T02:00:00Z", "America/Sao_Paulo", "1965-03-31", 23, 0, -10800, "UTC-03:00"],
  ["1966-03-01T02:59:59Z", "America/Sao_Paulo", "1966-03-01", 0, 59, -7200, "UTC-02:00"],
  ["1966-03-01T03:00:00Z", "America/Sao_Paulo", "1966-03-01", 0, 0, -10800, "UTC-03:00"],
])("uses published rules for %s in %s", (date, zone, day, hour, minute, offsetSeconds, abbreviation) => {
  expect(getZonedFields(new Date(date), zone)).toMatchObject({ date: day, hour, minute, offsetSeconds, abbreviation });
});
it.each([
  ["2026-11-01T04:59:59.999Z", "America/Winnipeg", "CDT", -18000],
  ["2026-11-01T05:00:00Z", "America/Winnipeg", "MBT", -18000],
  ["2027-01-15T12:00:00Z", "Canada/Central", "MBT", -18000],
  ["2027-07-15T12:00:00Z", "america/winnipeg", "MBT", -18000],
  ["2025-12-15T12:00:00Z", "Canada/Central", "CST", -21600],
  ["2027-01-15T12:00:00Z", "America/Rainy_River", "EST", -18000],
  ["2020-11-01T06:59:59.999Z", "America/Whitehorse", "PDT", -25200],
  ["2020-11-01T07:00:00Z", "America/Whitehorse", "YST", -25200],
  ["2020-11-01T06:59:59.999Z", "America/Dawson", "PDT", -25200],
  ["2020-11-01T07:00:00Z", "America/Dawson", "YST", -25200],
  ["2027-01-15T12:00:00Z", "Canada/Yukon", "YST", -25200],
  ["2027-07-15T12:00:00Z", "america/dawson", "YST", -25200],
  ["2019-12-15T12:00:00Z", "Canada/Yukon", "PST", -28800],
])("preserves historical and geographic naming at %s in %s", (instant, zone, abbreviation, offsetSeconds) => {
  expect(getZonedFields(new Date(instant), zone)).toMatchObject({ abbreviation, offsetSeconds });
});
it.each(["America/Yellowknife", "America/Inuvik", "america/yellowknife"])("names Northwest Territories Time without inventing a short code in %s", zone => {
  expect(getZonedFields(Date.parse("2026-08-21T05:59:59.999Z"), zone)).toMatchObject({ abbreviation: "MDT", timezoneName: undefined, offsetSeconds: -21600 });
  expect(getZonedFields(Date.parse("2026-08-21T06:00:00Z"), zone)).toMatchObject({ abbreviation: "MDT", timezoneName: "Northwest Territories Time", offsetSeconds: -21600 });
  for (const instant of ["2027-01-15T12:00:00Z", "2027-07-15T12:00:00Z"]) {
    expect(getZonedFields(Date.parse(instant), zone)).toMatchObject({ abbreviation: "CST", timezoneName: "Northwest Territories Time", offsetSeconds: -21600 });
  }
});
it.each(["America/Edmonton", "Canada/Mountain", "America/Regina"])("keeps the Northwest Territories name out of %s", zone => {
  expect(getZonedFields(Date.parse("2027-01-15T12:00:00Z"), zone).timezoneName).toBeUndefined();
});
it("does not show a canceled Cuba rollback or lengthen its calendar day", () => {
  const start = startOfCalendarDate("2026-11-01", "Cuba")!.getTime();
  const end = startOfCalendarDate("2026-11-02", "Cuba")!.getTime();
  expect(end - start).toBe(24 * 3_600_000);
  expect(timezoneTransitions(start, end, "Cuba").offsetChanges).toEqual([]);
});
it("is independent of stale or unavailable device Intl timezone rules", () => {
  const formatter = vi.spyOn(Intl, "DateTimeFormat").mockImplementation(() => { throw new Error("Device timezone data unavailable"); });
  try {
    expect(getZonedFields(new Date("2027-01-15T12:00Z"), "America/Vancouver")).toMatchObject({ hour: 5, offsetSeconds: -25200, abbreviation: "PCT" });
  } finally { formatter.mockRestore(); }
});
it("preserves a skipped calendar day and exact historical seconds", () => {
  expect(startOfCalendarDate("2011-12-30", "Pacific/Apia")).toBeNull();
  expect(getZonedFields(new Date("1900-01-01T00:00Z"), "Asia/Kathmandu").offsetSeconds).toBe(20476);
});

it("loads every selectable zone and alias into the active provider", () => {
  expect(TIMEZONE_DATA_VERSION).toBe(metadata.version);
  for (const name of getTimezoneNames()) {
    expect(() => ZoneId.of(name).rules()).not.toThrow();
  }
});
