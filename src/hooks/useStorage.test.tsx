import React, { StrictMode } from "react";
import { act, renderHook } from "@testing-library/react";
import { usePersistentState } from "./useStorage";
import { DEFAULT_SETTINGS, parseAppSettings } from "../utils/persistence";

const parseCount = (value: unknown): number => typeof value === "number" && Number.isFinite(value) ? value : 0;
const renderCount = () => renderHook(() => usePersistentState("count", 0, parseCount));

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});
afterEach(() => vi.restoreAllMocks());

it("keeps the loading slot and reports successful persistence explicitly", () => {
  const { result } = renderCount();
  expect(result.current).toMatchObject([0, expect.any(Function), false, "saved"]);
  expect(localStorage.getItem("count")).toBe("0");
});

it("survives a blocked localStorage property getter", () => {
  vi.spyOn(window, "localStorage", "get").mockImplementation(() => { throw new DOMException("Blocked", "SecurityError"); });
  const { result } = renderCount();
  expect(result.current[0]).toBe(0);
  expect(result.current[3]).toBe("unavailable");
  act(() => result.current[1]((value) => value + 1));
  expect(result.current[0]).toBe(1);
  expect(result.current[3]).toBe("unavailable");
});

it("does not overwrite unread saved data when getItem fails", () => {
  localStorage.setItem("count", "7");
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Read denied"); });
  const write = vi.spyOn(Storage.prototype, "setItem");
  const { result } = renderCount();
  expect(result.current[0]).toBe(0);
  expect(result.current[3]).toBe("unavailable");
  expect(write).not.toHaveBeenCalled();
  act(() => result.current[1]((value) => value + 1));
  expect(result.current[0]).toBe(1);
  expect(result.current[3]).toBe("unavailable");
  expect(write).not.toHaveBeenCalled();
});

it("recovers corrupt JSON without relying on a removeItem that may throw", () => {
  localStorage.setItem("count", "not JSON");
  const remove = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new Error("Remove denied"); });
  const { result } = renderCount();
  expect(result.current[0]).toBe(0);
  expect(result.current[3]).toBe("saved");
  expect(localStorage.getItem("count")).toBe("0");
  expect(remove).not.toHaveBeenCalled();
});

it("keeps migrated legacy values and writes their normalized shape", () => {
  localStorage.setItem("app_settings", JSON.stringify({ theme: "dark", showBadge: false }));
  const { result } = renderHook(() => usePersistentState("app_settings", DEFAULT_SETTINGS, parseAppSettings));
  expect(result.current[0]).toEqual({ ...DEFAULT_SETTINGS, theme: "dark", showBadge: false });
  expect(JSON.parse(localStorage.getItem("app_settings")!)).toEqual(result.current[0]);
});

it("keeps memory state on quota failure and supports later successful edits", () => {
  const { result } = renderCount();
  const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Full", "QuotaExceededError"); });
  act(() => result.current[1](10));
  expect(result.current[0]).toBe(10);
  expect(result.current[3]).toBe("unavailable");
  act(() => result.current[1]((value) => value + 5));
  expect(result.current[0]).toBe(15);
  write.mockRestore();
  act(() => result.current[1]((value) => value + 1));
  expect(result.current[0]).toBe(16);
  expect(result.current[3]).toBe("saved");
  expect(localStorage.getItem("count")).toBe("16");
});

it("catches a property getter that becomes blocked after initial rendering", () => {
  const { result } = renderCount();
  vi.spyOn(window, "localStorage", "get").mockImplementation(() => { throw new Error("Access revoked"); });
  act(() => result.current[1](4));
  expect(result.current[0]).toBe(4);
  expect(result.current[3]).toBe("unavailable");
});

it("reports an initialization write failure without leaking stored values in warnings", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Private error text"); });
  const warn = vi.spyOn(console, "warn");
  const { result } = renderCount();
  expect(result.current[3]).toBe("unavailable");
  expect(warn).not.toHaveBeenCalled();
});

it("runs pure functional updates and persists only the committed result under StrictMode", () => {
  localStorage.setItem("count", "0");
  const write = vi.spyOn(Storage.prototype, "setItem");
  const remove = vi.spyOn(Storage.prototype, "removeItem");
  const { result } = renderHook(() => usePersistentState("count", 0, parseCount), {
    wrapper: ({ children }: React.PropsWithChildren) => <StrictMode>{children}</StrictMode>,
  });
  const setter = result.current[1];
  expect(write).not.toHaveBeenCalled();
  act(() => {
    result.current[1]((value) => value + 1);
    result.current[1]((value) => value + 2);
  });
  expect(result.current[0]).toBe(3);
  expect(result.current[1]).toBe(setter);
  expect(write.mock.calls).toEqual([["count", "3"]]);
  expect(remove).not.toHaveBeenCalled();
});

it("writes a StrictMode recovery once without deleting saved data", () => {
  localStorage.setItem("app_settings", '{"theme":"dark"}');
  const write = vi.spyOn(Storage.prototype, "setItem");
  const remove = vi.spyOn(Storage.prototype, "removeItem");
  renderHook(() => usePersistentState("app_settings", DEFAULT_SETTINGS, parseAppSettings), {
    wrapper: ({ children }: React.PropsWithChildren) => <StrictMode>{children}</StrictMode>,
  });
  expect(write).toHaveBeenCalledTimes(1);
  expect(JSON.parse(localStorage.getItem("app_settings")!).theme).toBe("dark");
  expect(remove).not.toHaveBeenCalled();
});
