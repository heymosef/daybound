import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import * as calendarFields from "../utils/calendarDate";
import { AnalyticsProvider } from "../analytics/AnalyticsProvider";
import { ANALYTICS_PREFERENCE_KEY, createAnalytics } from "../analytics/analytics";


const LOCAL_SAVE_NOTICE_COPY =
  "Your changes are saved locally on this device. You can close this page and come back anytime.";

describe("App local save notice", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the local save notice by default", () => {
    render(<App />);

    expect(screen.getByText(LOCAL_SAVE_NOTICE_COPY)).toBeInTheDocument();
  });

  it("dismisses notice and keeps it hidden after reload", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);

    await user.click(
      screen.getByRole("button", {
        name: "Dismiss local save notice",
      }),
    );

    expect(screen.queryByText(LOCAL_SAVE_NOTICE_COPY)).not.toBeInTheDocument();
    expect(localStorage.getItem("local_save_notice_dismissed")).toBe("true");

    unmount();
    render(<App />);

    expect(screen.queryByText(LOCAL_SAVE_NOTICE_COPY)).not.toBeInTheDocument();
  });

  it("shows notice again when dismissal flag is removed", () => {
    localStorage.setItem("local_save_notice_dismissed", "true");
    localStorage.removeItem("local_save_notice_dismissed");

    render(<App />);

    expect(screen.getByText(LOCAL_SAVE_NOTICE_COPY)).toBeInTheDocument();
  });

  it("tabs from settings trigger to dismiss button with visible focus intent", async () => {
    const user = userEvent.setup();
    render(<App />);

    const settingsButton = screen.getByRole("button", { name: /settings/i });
    const dismissButton = screen.getByRole("button", {
      name: "Dismiss local save notice",
    });

    settingsButton.focus();
    expect(settingsButton).toHaveFocus();

    await user.tab();
    expect(dismissButton).toHaveFocus();
    expect(dismissButton).toHaveClass(
      "focus-visible:ring-2",
      "focus-visible:ring-[var(--dt-accent)]",
    );
  });

  it("keeps predictable tab flow after opening and closing settings menu", async () => {
    const user = userEvent.setup();
    render(<App />);

    const settingsButton = screen.getByRole("button", { name: /settings/i });
    const dismissButton = screen.getByRole("button", {
      name: "Dismiss local save notice",
    });

    await user.click(settingsButton);
    expect(settingsButton).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");
    expect(settingsButton).toHaveFocus();
    expect(settingsButton).toHaveAttribute("aria-expanded", "false");

    // AnimatePresence keeps the dropdown mounted during its exit animation.
    // Wait for it to be fully removed before testing tab order.
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    await user.tab();
    expect(dismissButton).toHaveFocus();
  });
});

const STORAGE_FAILURE_COPY = "Changes work for this visit, but cannot be saved on this device.";

describe("App persistence recovery", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ["null settings and entries", "null", "[null]"],
    ["corrupt JSON", "{broken", "{broken"],
    ["wrong shapes", "[]", "{}"],
    ["invalid enums and timezone", '{"theme":{},"designTheme":"unknown"}', '[{"id":"bad","timezone":"Not/A_Zone"}]'],
  ])("starts with %s and persists usable recovered state", (_name, settings, rows) => {
    localStorage.setItem("app_settings", settings);
    localStorage.setItem("timezone_config", rows);
    localStorage.setItem("local_save_notice_dismissed", '"true"');
    render(<App />);
    expect(screen.getByRole("button", { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByText(LOCAL_SAVE_NOTICE_COPY)).toBeInTheDocument();
    const recoveredSettings = JSON.parse(localStorage.getItem("app_settings")!);
    const recoveredRows = JSON.parse(localStorage.getItem("timezone_config")!);
    expect(recoveredSettings.designTheme).toBe("te-1");
    expect(recoveredRows).toHaveLength(1);
    expect(recoveredRows[0].isHome).toBe(true);
    expect(() => new Intl.DateTimeFormat("en", { timeZone: recoveredRows[0].timezone })).not.toThrow();
  });

  it("preserves valid custom rows, order and IDs while migrating legacy partial settings", async () => {
    const user = userEvent.setup();
    const rows = [
      { id: "custom-1", timezone: "US/Pacific", label: "West team α", country: "Custom region", isHome: false },
      { id: "custom-2", timezone: "UTC", label: "UTC desk", isHome: true },
    ];
    localStorage.setItem("app_settings", '{"theme":"dark","showBadge":false}');
    localStorage.setItem("timezone_config", JSON.stringify([null, ...rows]));
    render(<App />);
    expect(screen.getByText("West team α")).toBeInTheDocument();
    expect(screen.getByText("UTC desk")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("timezone_config")!)).toEqual(rows);
    expect(JSON.parse(localStorage.getItem("app_settings")!)).toMatchObject({ theme: "dark", showBadge: false });
    await user.click(screen.getByRole("button", { name: /settings/i }));
    expect(screen.getByRole("menuitemradio", { name: "Dark" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemcheckbox", { name: "Timezone badge" })).toHaveAttribute("aria-checked", "false");
  });

  it("keeps the app editable when the storage property getter is blocked", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => { throw new DOMException("Blocked", "SecurityError"); });
    render(<App />);
    expect(screen.getByRole("status", { name: "Local save status" })).toHaveTextContent(STORAGE_FAILURE_COPY);
    expect(screen.queryByText(LOCAL_SAVE_NOTICE_COPY)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /settings/i }));
    await user.click(screen.getByRole("menuitemradio", { name: "24H" }));
    expect(screen.getByRole("menuitemradio", { name: "24H" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("status", { name: "Local save status" })).toHaveTextContent(STORAGE_FAILURE_COPY);
  });

  it.each(["app_settings", "timezone_config", "local_save_notice_dismissed"])("reports an independent read failure for %s", (blockedKey) => {
    const read = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (this: Storage, key: string) {
      if (key === blockedKey) throw new Error("Blocked read");
      return read.call(this, key);
    });
    render(<App />);
    expect(screen.getByRole("status", { name: "Local save status" })).toHaveTextContent(STORAGE_FAILURE_COPY);
    expect(screen.getByRole("button", { name: /settings/i })).toBeInTheDocument();
  });

  it("never overwrites an unread dashboard when all keys fail to read", async () => {
    const user = userEvent.setup();
    const saved = {
      app_settings: '{"theme":"dark","showBadge":false}',
      timezone_config: '[{"id":"saved-home","timezone":"Asia/Tokyo","label":"Saved team","isHome":true}]',
      local_save_notice_dismissed: "true",
    };
    for (const [key, value] of Object.entries(saved)) localStorage.setItem(key, value);
    const read = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("All reads denied"); });
    const write = vi.spyOn(Storage.prototype, "setItem");
    render(<App />);
    expect(screen.getByRole("status", { name: "Local save status" })).toHaveTextContent(STORAGE_FAILURE_COPY);
    await user.click(screen.getByRole("button", { name: /settings/i }));
    await user.click(screen.getByRole("menuitemradio", { name: "24H" }));
    expect(screen.getByRole("menuitemradio", { name: "24H" })).toHaveAttribute("aria-checked", "true");
    expect(write).not.toHaveBeenCalled();
    for (const [key, value] of Object.entries(saved)) expect(read.call(localStorage, key)).toBe(value);
  });

  it("shows a later save failure despite an earlier successful notice dismissal", async () => {
    const user = userEvent.setup();
    render(<App />);
    const status = screen.getByRole("status", { name: "Local save status" });
    await user.click(screen.getByRole("button", { name: "Dismiss local save notice" }));
    expect(status).toBeEmptyDOMElement();
    expect(localStorage.getItem("local_save_notice_dismissed")).toBe("true");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Full", "QuotaExceededError"); });
    await user.click(screen.getByRole("button", { name: /settings/i }));
    await user.click(screen.getByRole("menuitemradio", { name: "24H" }));
    expect(screen.getByRole("menuitemradio", { name: "24H" })).toHaveAttribute("aria-checked", "true");
    expect(status).toHaveTextContent(STORAGE_FAILURE_COPY);
    expect(screen.queryByRole("button", { name: "Dismiss local save notice" })).not.toBeInTheDocument();
    expect(screen.queryByText(LOCAL_SAVE_NOTICE_COPY)).not.toBeInTheDocument();
  });

  it("does not hide a failure when writing the dismissal flag is rejected", async () => {
    const user = userEvent.setup();
    render(<App />);
    const write = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === "local_save_notice_dismissed") throw new Error("Write denied");
      write.call(this, key, value);
    });
    await user.click(screen.getByRole("button", { name: "Dismiss local save notice" }));
    expect(screen.getByRole("status", { name: "Local save status" })).toHaveTextContent(STORAGE_FAILURE_COPY);
  });

  it("uses validated settings for synchronous theme initialization without writing storage", async () => {
    localStorage.setItem("app_settings", '{"designTheme":"invalid-theme","theme":null}');
    const write = vi.spyOn(Storage.prototype, "setItem");
    vi.resetModules();
    await import("./App");
    expect(document.documentElement).toHaveAttribute("data-design-theme", "te-1");
    expect(document.documentElement).not.toHaveClass("dark");
    expect(write).not.toHaveBeenCalled();
  });
});


describe("App fixed calendar selection lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-02T23:59:50Z"));
    localStorage.clear();
    localStorage.setItem("timezone_config", JSON.stringify([
      { id: "utc", timezone: "UTC", label: "UTC desk", isHome: true },
      { id: "west", timezone: "Pacific/Honolulu", label: "West", isHome: false },
      { id: "east", timezone: "Pacific/Kiritimati", label: "East", isHome: false },
    ]));
  });
  afterEach(() => vi.useRealTimers());

  const expectView = (mode: "live" | "date", instant: string) => {
    const rails = document.querySelectorAll("[data-date-mode]");
    expect(rails).toHaveLength(3);
    for (const rail of rails) {
      expect(rail).toHaveAttribute("data-date-mode", mode);
      expect(rail).toHaveAttribute("data-preview-instant", instant);
    }
  };
  const advanceTo = (instant: string) => act(() => {
    vi.setSystemTime(new Date(instant));
    vi.advanceTimersByTime(1000);
    window.dispatchEvent(new Event("focus"));
  });

  it("keeps a far-future chosen date across midnight and home changes across the date line", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Open calendar" }));
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    fireEvent.click(screen.getByRole("button", { name: "Wednesday, April 15, 2026" }));
    expectView("date", "2026-04-15T00:00:00.000Z");
    advanceTo("2026-03-03T00:00:00Z");
    expectView("date", "2026-04-15T00:00:00.000Z");
    fireEvent.click(screen.getByRole("button", { name: /settings/i }));
    fireEvent.change(within(screen.getByRole("menu")).getByRole("combobox"), { target: { value: "west" } });
    expectView("date", "2026-04-15T10:00:00.000Z");
    fireEvent.change(within(screen.getByRole("menu")).getByRole("combobox"), { target: { value: "east" } });
    expectView("date", "2026-04-14T10:00:00.000Z");
    expect(localStorage.getItem("selected_date")).toBeNull();
    expect(screen.getByRole("status", { name: "Local save status" })).toHaveTextContent(LOCAL_SAVE_NOTICE_COPY);
  });

  it("retains preview when the selected date becomes today, then returns live once past", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "3 Mar" }));
    expectView("date", "2026-03-03T00:00:00.000Z");
    advanceTo("2026-03-03T12:00:00Z");
    expectView("date", "2026-03-03T00:00:00.000Z");
    advanceTo("2026-03-04T00:00:00Z");
    expectView("live", "2026-03-04T00:00:01.000Z");
  });

  it("keeps selected-today after a home change and immediately falls back if the home date passes it", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "3 Mar" }));
    fireEvent.click(screen.getByRole("button", { name: /settings/i }));
    fireEvent.change(within(screen.getByRole("menu")).getByRole("combobox"), { target: { value: "east" } });
    expectView("date", "2026-03-02T10:00:00.000Z");
    advanceTo("2026-03-03T12:00:00Z");
    expectView("live", "2026-03-03T12:00:01.000Z");
  });

  it("returns live through explicit Today and starts live after reload", () => {
    const { unmount } = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "3 Mar" }));
    fireEvent.click(screen.getByRole("button", { current: "date" }));
    expectView("live", "2026-03-02T23:59:50.000Z");
    fireEvent.click(screen.getByRole("button", { name: "3 Mar" }));
    expectView("date", "2026-03-03T00:00:00.000Z");
    unmount();
    render(<App />);
    expectView("live", "2026-03-02T23:59:50.000Z");
  });
});


describe("App minimal analytics transport integration", () => {
  const options = { token: "phc_offline_fixture", host: "https://analytics.example.invalid", production: true, hostname: "daybound.example.invalid", doNotTrack: () => false };
  const request = vi.fn<typeof fetch>();
  const privateLabel = "PrivateDashboardAccount Orchid8472";
  const privateRename = "PrivateCustomerPayroll Tanager3819";
  let originalURL: string;
  let originalTitle: string;
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("timezone_config", JSON.stringify([
      { id: "private-row-id", timezone: "UTC", label: privateLabel, isHome: true },
      { id: "other-private-id", timezone: "Europe/London", label: "SecretOtherOffice Wren6681", isHome: false },
    ]));
    originalURL = window.location.href;
    originalTitle = document.title;
    window.history.replaceState({}, "", "/PrivateDashboardPath?account=PrivateAccountQuery#PrivateHash");
    document.title = "PrivateDashboardTitle";
    request.mockReset().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", request);
  });
  afterEach(() => {
    window.history.replaceState({}, "", originalURL);
    document.title = originalTitle;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("sends actual rename/home-change events without any editable or browser data", () => {
    render(<AnalyticsProvider options={options}><App /></AnalyticsProvider>);
    expect(request).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText(privateLabel));
    fireEvent.change(screen.getByRole("textbox", { name: "Edit timezone label" }), { target: { value: privateRename } });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Edit timezone label" }), { key: "Enter" });
    expect(screen.getByText(privateRename)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /settings/i }));
    fireEvent.change(within(screen.getByRole("menu")).getByRole("combobox"), { target: { value: "other-private-id" } });
    const flags = { $process_person_profile: false, $geoip_disable: true };
    expect(request.mock.calls.map(([url, init]) => {
      expect(url).toBe("https://analytics.example.invalid/i/v0/e/");
      expect(init).toEqual({ method: "POST", headers: { "Content-Type": "application/json" }, body: expect.any(String), credentials: "omit", referrerPolicy: "no-referrer", redirect: "error", signal: expect.any(AbortSignal) });
      const body = JSON.parse(String(init!.body));
      expect(body).toEqual({ api_key: options.token, event: expect.any(String), distinct_id: expect.stringMatching(/^[\da-f-]{36}$/), timestamp: expect.any(String),
        properties: body.event === "home_timezone_changed" ? { ...flags, reference_timezone: "Europe/London" } : flags });
      return body.event;
    })).toEqual(["timezone_renamed", "home_timezone_changed"]);
    const envelopes = JSON.stringify(request.mock.calls);
    for (const text of [privateLabel, privateRename, "SecretOtherOffice", "private-row-id", "other-private-id", "PrivateDashboardPath", "PrivateAccountQuery", "PrivateHash", "PrivateDashboardTitle", "home_city", "$current_url", "$referrer"]) expect(envelopes).not.toContain(text);
  });

  const eventBodies = () => request.mock.calls.map(([, init]) => JSON.parse(String(init!.body)));

  it("records only actual settings changes, without startup, no-op or reload snapshots", () => {
    const { unmount } = render(<AnalyticsProvider options={options}><App /></AnalyticsProvider>);
    expect(request).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /settings/i }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "12H" }));
    expect(request).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("menuitemradio", { name: "24H" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Dark" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Gamut" }));
    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "Timezone badge" }));
    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "Indicate weekends" }));
    expect(eventBodies().map(({ event, properties }) => ({ event, ...properties }))).toEqual([
      { setting: "time_format", value: "24h" }, { setting: "appearance", value: "dark" },
      { setting: "design_theme", value: "gamut" }, { setting: "timezone_badge", value: false },
      { setting: "weekend_indicator", value: true },
    ].map((properties) => ({ event: "settings_changed", ...properties, $process_person_profile: false, $geoip_disable: true })));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "24H" }));
    expect(request).toHaveBeenCalledTimes(5);
    unmount();
    render(<AnalyticsProvider options={options}><App /></AnalyticsProvider>);
    expect(request).toHaveBeenCalledTimes(5);
    fireEvent.click(screen.getByRole("button", { name: /settings/i }));
    expect(screen.getByRole("menuitemradio", { name: "24H" })).toHaveAttribute("aria-checked", "true");
  });

  it("preserves a picker alias through rename/reload and reports it when explicitly made home", () => {
    const { unmount } = render(<AnalyticsProvider options={options}><App /></AnalyticsProvider>);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Seattle" } });
    fireEvent.click(screen.getByRole("option", { name: /Seattle/ }));
    const added = JSON.parse(localStorage.getItem("timezone_config")!).find((row: { city?: string }) => row.city === "Seattle");
    expect(added).toMatchObject({ timezone: "America/Los_Angeles", city: "Seattle" });
    fireEvent.click(screen.getByText("Seattle", { selector: "span.truncate" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Edit timezone label" }), { target: { value: privateRename } });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Edit timezone label" }), { key: "Enter" });
    unmount();
    render(<AnalyticsProvider options={options}><App /></AnalyticsProvider>);
    fireEvent.click(screen.getByRole("button", { name: /settings/i }));
    const homeSelect = within(screen.getByRole("menu")).getByRole("combobox");
    fireEvent.change(homeSelect, { target: { value: added.id } });
    expect(eventBodies().filter(({ event }) => event === "home_timezone_changed").map(({ properties }) => properties)).toEqual([{
      reference_timezone: "America/Los_Angeles", reference_result_id: "America/Los_Angeles|Seattle",
      reference_city: "Seattle", reference_country: "USA", $process_person_profile: false, $geoip_disable: true,
    }]);
    fireEvent.change(homeSelect, { target: { value: added.id } });
    expect(eventBodies().filter(({ event }) => event === "home_timezone_changed")).toHaveLength(1);
    expect(JSON.stringify(request.mock.calls)).not.toContain(privateRename);
    expect(JSON.stringify(request.mock.calls)).not.toContain(added.id);
  });

  it("keeps settings and home editable while opted out and does not replay them on opt-in", () => {
    localStorage.setItem(ANALYTICS_PREFERENCE_KEY, '{"version":1,"enabled":false}');
    render(<AnalyticsProvider options={options}><App /></AnalyticsProvider>);
    fireEvent.click(screen.getByRole("button", { name: /settings/i }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "24H" }));
    fireEvent.change(within(screen.getByRole("menu")).getByRole("combobox"), { target: { value: "other-private-id" } });
    expect(JSON.parse(localStorage.getItem("app_settings")!).use24Hour).toBe(true);
    expect(JSON.parse(localStorage.getItem("timezone_config")!)[0].id).toBe("other-private-id");
    expect(request).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "Allow usage analytics" }));
    expect(request).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("menuitemradio", { name: "12H" }));
    expect(eventBodies()).toHaveLength(1);
    expect(eventBodies()[0]).toMatchObject({ event: "settings_changed", properties: { setting: "time_format", value: "12h" } });
  });

  it("honors opt-out before the first real App action and after reload", () => {
    localStorage.setItem(ANALYTICS_PREFERENCE_KEY, '{"version":1,"enabled":false}');
    const { unmount } = render(<AnalyticsProvider options={options}><App /></AnalyticsProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Open calendar" }));
    expect(request).not.toHaveBeenCalled();
    unmount();
    render(<AnalyticsProvider options={options}><App /></AnalyticsProvider>);
    fireEvent.click(screen.getByRole("button", { name: /settings/i }));
    expect(screen.getByRole("menuitemcheckbox", { name: "Allow usage analytics" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("status", { name: "Usage analytics status" })).toHaveTextContent(/^Off$/);
    expect(request).not.toHaveBeenCalled();
  });

  it("renders working App and an unavailable analytics control with no configuration", () => {
    render(<AnalyticsProvider options={{ production: true, hostname: "daybound.example.invalid" }}><App /></AnalyticsProvider>);
    expect(screen.getByText(privateLabel)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open calendar" }));
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: /settings/i }));
    expect(screen.getByRole("menuitemcheckbox", { name: "Allow usage analytics" })).toBeDisabled();
    expect(screen.getByRole("status", { name: "Usage analytics status" })).toHaveTextContent("Usage analytics is unavailable here.");
    expect(screen.getByRole("status", { name: "Local save status" })).toHaveTextContent(LOCAL_SAVE_NOTICE_COPY);
    expect(request).not.toHaveBeenCalled();
  });

  it("distinguishes analytics write failure from successful app preference storage", () => {
    const write = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === ANALYTICS_PREFERENCE_KEY) throw new DOMException("Full", "QuotaExceededError");
      write.call(this, key, value);
    });
    const controller = createAnalytics(options);
    render(<AnalyticsProvider controller={controller}><App /></AnalyticsProvider>);
    fireEvent.click(screen.getByRole("button", { name: /settings/i }));
    expect(screen.getByRole("status", { name: "Usage analytics status" })).toHaveTextContent("Off for this visit; preference could not be saved.");
    expect(screen.getByRole("status", { name: "Local save status" })).toHaveTextContent(LOCAL_SAVE_NOTICE_COPY);
    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "Allow usage analytics" }));
    expect(controller.getSnapshot()).toMatchObject({ enabled: false, preferenceStatus: "unavailable" });
    expect(request).not.toHaveBeenCalled();
  });
});


it("reuses fixed-date and calendar-day resolutions through hover, closed/open minute updates", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-02T12:00:00Z"));
  localStorage.clear();
  localStorage.setItem("timezone_config", '[{"id":"utc","timezone":"UTC","isHome":true}]');
  const starts = vi.spyOn(calendarFields, "startOfCalendarDate");
  const { container, unmount } = render(<App />);
  expect(starts.mock.calls.length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("button", { name: "3 Mar" }));
  starts.mockClear();
  fireEvent.mouseEnter(container.querySelector('[data-timeline-cell="5"]')!);
  expect(starts).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(60000));
  expect(starts).not.toHaveBeenCalled();
  expect(container.querySelector("[data-preview-instant]")).toHaveAttribute("data-preview-instant", "2026-03-03T00:00:00.000Z");
  fireEvent.click(screen.getByRole("button", { name: "Open calendar" }));
  fireEvent.click(screen.getByRole("button", { name: "Next month" }));
  expect(screen.getByText("April 2026")).toBeInTheDocument();
  starts.mockClear();
  act(() => vi.advanceTimersByTime(60000));
  expect(starts).not.toHaveBeenCalled();
  expect(screen.getByText("April 2026")).toBeInTheDocument();
  unmount();
  starts.mockRestore();
  vi.useRealTimers();
});


describe("synchronized timeline exploration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-22T19:43:00Z"));
    localStorage.clear();
    localStorage.setItem("app_settings", JSON.stringify({ use24Hour: true }));
    localStorage.setItem("timezone_config", JSON.stringify([
      { id: "utc", timezone: "UTC", isHome: true },
      { id: "tokyo", timezone: "Asia/Tokyo", isHome: false },
    ]));
  });
  afterEach(() => { vi.useRealTimers(); });
  const views = () => screen.getAllByRole("region", { name: /timeline\. Drag/ });
  const instants = () => views().map(view => view.getAttribute("data-preview-instant"));
  it("reaches 24 hours ahead on all rows, freezes the view across minutes, and leaves clocks live", () => {
    render(<App />);
    for (let i = 0; i < 4; i++) fireEvent.keyDown(views()[0], { key: "ArrowRight", shiftKey: true });
    expect(instants()).toEqual(["2026-10-23T19:43:00.000Z", "2026-10-23T19:43:00.000Z"]);
    fireEvent.keyDown(views()[1], { key: "ArrowRight" });
    expect(instants()).toEqual(["2026-10-23T19:43:00.000Z", "2026-10-23T19:43:00.000Z"]);
    act(() => vi.advanceTimersByTime(60000));
    expect(instants()[0]).toBe("2026-10-23T19:43:00.000Z");
    for (const clock of screen.getAllByTestId("row-clock")) expect(clock).toHaveAttribute("datetime", "2026-10-22T19:44:00.000Z");
    expect(screen.getByRole("button", { name: "23 Oct", pressed: true })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Return to now" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Exploring ·|Swipe timelines/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "22 Oct" }));
    expect(instants()[0]).toBe("2026-10-22T19:44:00.000Z");
    expect(screen.getByRole("button", { name: "22 Oct", pressed: true })).toBeInTheDocument();
  });
  it("resets exploration on date selection and home changes", () => {
    render(<App />);
    fireEvent.keyDown(views()[0], { key: "ArrowRight" });
    fireEvent.click(screen.getByRole("button", { name: "23 Oct" }));
    expect(instants()).toEqual(["2026-10-23T00:00:00.000Z", "2026-10-23T00:00:00.000Z"]);
    expect(screen.getByRole("button", { name: "23 Oct", pressed: true })).toBeInTheDocument();
    fireEvent.keyDown(views()[0], { key: "ArrowRight" });
    fireEvent.click(screen.getByRole("button", { name: /settings/i }));
    fireEvent.change(within(screen.getByRole("menu")).getByRole("combobox"), { target: { value: "tokyo" } });
    expect(instants()[0]).toBe("2026-10-22T15:00:00.000Z");
    expect(screen.getByRole("button", { name: "23 Oct", pressed: true })).toBeInTheDocument();
  });
  it("updates the calendar as the rail crosses a date, and can reselect the surfaced date", () => {
    render(<App />);
    fireEvent.keyDown(views()[0], { key: "ArrowRight", shiftKey: true });
    expect(instants()[0]).toBe("2026-10-23T01:43:00.000Z");
    expect(screen.getByRole("button", { name: "23 Oct", pressed: true })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open calendar" }));
    expect(within(screen.getByRole("dialog", { name: "Choose date" })).getByRole("button", { name: "Friday, October 23, 2026", pressed: true })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "23 Oct" }));
    expect(instants()[0]).toBe("2026-10-23T00:00:00.000Z");
    for (let i = 0; i < 4; i++) fireEvent.keyDown(views()[0], { key: "ArrowRight", shiftKey: true });
    expect(screen.getByRole("button", { name: "24 Oct", pressed: true })).toBeInTheDocument();
    expect(instants()[0]).toBe("2026-10-24T00:00:00.000Z");
  });
  it("recenters on tapping today even when the explored time is still today", () => {
    render(<App />);
    fireEvent.keyDown(views()[0], { key: "ArrowRight" });
    expect(instants()[0]).toBe("2026-10-22T20:43:00.000Z");
    fireEvent.click(screen.getByRole("button", { name: "22 Oct", pressed: true }));
    expect(instants()[0]).toBe("2026-10-22T19:43:00.000Z");
  });
  it("shows a previous surfaced date without treating it as a new calendar selection", () => {
    vi.setSystemTime(new Date("2026-10-22T02:00:00Z"));
    render(<App />);
    fireEvent.keyDown(views()[0], { key: "ArrowLeft", shiftKey: true });
    expect(instants()[0]).toBe("2026-10-21T20:00:00.000Z");
    expect(screen.getByRole("button", { name: "Back to today" })).toHaveTextContent("21Oct");
    act(() => vi.advanceTimersByTime(60000));
    expect(instants()[0]).toBe("2026-10-21T20:00:00.000Z");
    fireEvent.click(screen.getByRole("button", { name: "22 Oct" }));
    expect(instants()[0]).toBe("2026-10-22T02:01:00.000Z");
  });
  it("accepts horizontal wheels and preserves vertical page scrolling", () => {
    render(<App />);
    fireEvent.wheel(views()[0], { deltaY: 100 });
    act(() => vi.advanceTimersByTime(20));
    expect(instants()[0]).toBe("2026-10-22T19:43:00.000Z");
    const horizontal = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaX: 100 });
    fireEvent(views()[0], horizontal);
    expect(horizontal.defaultPrevented).toBe(true);
    act(() => vi.advanceTimersToNextFrame());
    expect(instants()[0]).not.toBe("2026-10-22T19:43:00.000Z");
    expect(instants()[0]).toBe(instants()[1]);
  });
});
