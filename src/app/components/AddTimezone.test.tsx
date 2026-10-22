import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { AddTimezone } from "./AddTimezone";
import { AnalyticsProvider } from "../../analytics/AnalyticsProvider";
import { createAnalytics } from "../../analytics/analytics";

const OPTIONS = { token: "phc_offline_fixture", host: "https://analytics.example.invalid", production: true, hostname: "daybound.example.invalid", doNotTrack: () => false };
const PRIVATE_QUERY = "PrivateZebraProject ConfidentialSearch-8472";
const request = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  request.mockReset().mockResolvedValue(new Response(null, { status: 200 }));
  vi.stubGlobal("fetch", request);
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("sends only counts from an actual private failed search, never text or metadata", () => {
  render(<AnalyticsProvider options={OPTIONS}><AddTimezone onAdd={vi.fn()} existingTimezones={[]} /></AnalyticsProvider>);
  expect(request).not.toHaveBeenCalled();
  fireEvent.change(screen.getByPlaceholderText("Search major city"), { target: { value: PRIVATE_QUERY } });
  act(() => vi.advanceTimersByTime(701));
  expect(request).toHaveBeenCalledTimes(1);
  const [url, init] = request.mock.calls[0];
  expect(url).toBe("https://analytics.example.invalid/i/v0/e/");
  const body = JSON.parse(String(init!.body));
  expect(body).toEqual({
    api_key: OPTIONS.token, event: "timezone_search_no_results", distinct_id: expect.stringMatching(/^[\da-f-]{36}$/),
    timestamp: expect.any(String), properties: {
      query_length: PRIVATE_QUERY.length, query_words: 2, $process_person_profile: false, $geoip_disable: true,
    },
  });
  expect(init).toEqual({ method: "POST", headers: { "Content-Type": "application/json" }, body: expect.any(String), credentials: "omit", referrerPolicy: "no-referrer", redirect: "error", signal: expect.any(AbortSignal) });
  const envelope = JSON.stringify(request.mock.calls);
  for (const privateText of [PRIVATE_QUERY, "privatezebraproject", "ConfidentialSearch", "8472", "query_sanitized", "$current_url", "$referrer"]) expect(envelope).not.toContain(privateText);
});

it("retains the search keyboard shortcut event without adding browser metadata", () => {
  render(<AnalyticsProvider options={OPTIONS}><AddTimezone onAdd={vi.fn()} existingTimezones={[]} /></AnalyticsProvider>);
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  act(() => vi.advanceTimersByTime(11));
  expect(screen.getByPlaceholderText("Search major city")).toHaveFocus();
  expect(JSON.parse(String(request.mock.calls[0][1]!.body))).toMatchObject({ event: "keyboard_shortcut_used", properties: { shortcut: "ctrl_k", $process_person_profile: false, $geoip_disable: true } });
});

it("does not flush an already scheduled failed-search event after opting out", () => {
  const controller = createAnalytics(OPTIONS);
  render(<AnalyticsProvider controller={controller}><AddTimezone onAdd={vi.fn()} existingTimezones={[]} /></AnalyticsProvider>);
  fireEvent.change(screen.getByPlaceholderText("Search major city"), { target: { value: PRIVATE_QUERY } });
  act(() => controller.setEnabled(false));
  act(() => vi.advanceTimersByTime(5000));
  fireEvent(window, new Event("online"));
  fireEvent(window, new Event("unload"));
  expect(request).not.toHaveBeenCalled();
});
