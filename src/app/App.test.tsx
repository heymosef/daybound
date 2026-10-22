import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

vi.mock("@posthog/react", () => ({
  usePostHog: () => null,
}));

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
    expect(screen.getByRole("status")).toHaveTextContent(STORAGE_FAILURE_COPY);
    expect(screen.queryByText(LOCAL_SAVE_NOTICE_COPY)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /settings/i }));
    await user.click(screen.getByRole("menuitemradio", { name: "24H" }));
    expect(screen.getByRole("menuitemradio", { name: "24H" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("status")).toHaveTextContent(STORAGE_FAILURE_COPY);
  });

  it.each(["app_settings", "timezone_config", "local_save_notice_dismissed"])("reports an independent read failure for %s", (blockedKey) => {
    const read = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (this: Storage, key: string) {
      if (key === blockedKey) throw new Error("Blocked read");
      return read.call(this, key);
    });
    render(<App />);
    expect(screen.getByRole("status")).toHaveTextContent(STORAGE_FAILURE_COPY);
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
    expect(screen.getByRole("status")).toHaveTextContent(STORAGE_FAILURE_COPY);
    await user.click(screen.getByRole("button", { name: /settings/i }));
    await user.click(screen.getByRole("menuitemradio", { name: "24H" }));
    expect(screen.getByRole("menuitemradio", { name: "24H" })).toHaveAttribute("aria-checked", "true");
    expect(write).not.toHaveBeenCalled();
    for (const [key, value] of Object.entries(saved)) expect(read.call(localStorage, key)).toBe(value);
  });

  it("shows a later save failure despite an earlier successful notice dismissal", async () => {
    const user = userEvent.setup();
    render(<App />);
    const status = screen.getByRole("status");
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
    expect(screen.getByRole("status")).toHaveTextContent(STORAGE_FAILURE_COPY);
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
