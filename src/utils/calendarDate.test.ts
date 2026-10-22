import { addCalendarDays, addCalendarMonths, calendarDifference, calendarMonthDays, getZonedFields, isCalendarDate, resolveDateSelection, startOfCalendarDate } from "./calendarDate";

it.each(["2026-02-29", "2026-13-01", "2026-00-01", "2026-03-00", "0000-01-01", "2026-3-01", "garbage"])("rejects invalid key %s", (key) => expect(isCalendarDate(key)).toBe(false));
it("uses UTC calendar fields for leap days and month/year arithmetic", () => {
  expect(isCalendarDate("2024-02-29")).toBe(true);
  expect(isCalendarDate("0099-01-01")).toBe(true);
  expect(addCalendarDays("2026-12-31", 1)).toBe("2027-01-01");
  expect(addCalendarMonths("2026-12-31", 1)).toBe("2027-01-01");
  expect(calendarMonthDays("2024-02-10")).toHaveLength(29);
  expect(calendarDifference("2026-03-09", "2026-03-07")).toBe(2);
});
it("extracts Kolkata fields through the Vancouver browser DST gap", () => {
  expect(getZonedFields(new Date("2026-03-07T21:00:00Z"), "Asia/Kolkata")).toMatchObject({ date: "2026-03-08", hour: 2, minute: 30, offsetSeconds: 19800 });
});
it.each([
  ["0001-01-01", "UTC", "0001-01-01T00:00:00.000Z", 0],
  ["0099-01-01", "UTC", "0099-01-01T00:00:00.000Z", 0],
  ["2026-03-08", "Asia/Kathmandu", "2026-03-07T18:15:00.000Z", 0],
  ["2026-09-06", "America/Santiago", "2026-09-06T04:00:00.000Z", 1],
  ["2026-11-01", "America/Havana", "2026-11-01T04:00:00.000Z", 0],
  ["2026-10-04", "Australia/Lord_Howe", "2026-10-03T13:30:00.000Z", 0],
  ["2026-04-05", "Australia/Lord_Howe", "2026-04-04T13:00:00.000Z", 0],
  ["2026-03-08", "America/New_York", "2026-03-08T05:00:00.000Z", 0],
  ["2026-11-01", "America/New_York", "2026-11-01T04:00:00.000Z", 0],
  ["2026-03-08", "Pacific/Kiritimati", "2026-03-07T10:00:00.000Z", 0],
])("resolves earliest date %s in %s", (date, zone, expected, hour) => {
  const start = startOfCalendarDate(date, zone)!;
  expect(start.toISOString()).toBe(expected);
  expect(getZonedFields(start, zone)).toMatchObject({ date, hour, minute: 0 });
  expect(getZonedFields(start.getTime() - 1, zone).date).not.toBe(date);
  for (let earlier = start.getTime() - 36 * 3600000; earlier < start.getTime(); earlier += 15 * 60000) {
    expect(getZonedFields(earlier, zone).date).not.toBe(date);
  }
});
it("rejects an entirely skipped date rather than choosing a different day", () => {
  expect(startOfCalendarDate("2011-12-30", "Pacific/Apia")).toBeNull();
  expect(resolveDateSelection({ mode: "date", date: "2011-12-30" }, new Date("2011-12-29T00:00:00Z"), "Pacific/Apia")).toMatchObject({ isLive: true, unavailable: true });
});
it("preserves a fixed date across midnight, home changes and equal-today; only past becomes live", () => {
  const selection = { mode: "date", date: "2026-03-08" } as const;
  expect(resolveDateSelection(selection, new Date("2026-03-07T23:59:59Z"), "UTC")).toMatchObject({ isLive: false, selectedDate: "2026-03-08", offset: 1 });
  expect(resolveDateSelection(selection, new Date("2026-03-08T00:00:00Z"), "UTC")).toMatchObject({ isLive: false, selectedDate: "2026-03-08", offset: 0 });
  expect(resolveDateSelection(selection, new Date("2026-03-08T00:00:00Z"), "Pacific/Honolulu")).toMatchObject({ isLive: false, selectedDate: "2026-03-08", offset: 1 });
  expect(resolveDateSelection(selection, new Date("2026-03-09T00:00:00Z"), "UTC").isLive).toBe(true);
});
