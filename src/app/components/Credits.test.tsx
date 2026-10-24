import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Credits } from "./Credits";

// jsdom lacks the native dialog methods; browser checks own focus containment/Escape.
const methods = ["showModal", "close"] as const;
const originals = methods.map(method => Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, method));
beforeAll(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } },
    close: { configurable: true, value: function (this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event("close"));
    } },
  });
});
afterAll(() => methods.forEach((method, i) => {
  if (originals[i]) Object.defineProperty(HTMLDialogElement.prototype, method, originals[i]!);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, method);
}));

it("opens a named modal with source, licence and adaptation credits", () => {
  render(<Credits />);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Credits" }));
  const dialog = screen.getByRole("dialog", { name: "Credits" });
  expect(dialog).toHaveAttribute("open");
  expect(within(dialog).getByRole("link", { name: /^GeoNames/ })).toHaveAttribute("href", "https://www.geonames.org/");
  expect(within(dialog).getByRole("link", { name: /^Creative Commons Attribution 4.0/ })).toHaveAttribute("href", "https://creativecommons.org/licenses/by/4.0/");
  expect(within(dialog).getByRole("link", { name: /^Source data and documentation/ })).toHaveAttribute("href", "https://download.geonames.org/export/dump/readme.txt");
  for (const link of within(dialog).getAllByRole("link")) expect(link).toHaveAttribute("target", "_blank");
  expect(dialog).toHaveTextContent("coordinates and population data removed");
});

it("closes and returns focus to Credits, and can reopen", () => {
  render(<Credits />);
  const trigger = screen.getByRole("button", { name: "Credits" });
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole("button", { name: "Close credits" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  fireEvent.click(trigger);
  expect(screen.getByRole("dialog", { name: "Credits" })).toHaveAttribute("open");
});

it("dismisses a backdrop click while keeping content clicks open", () => {
  render(<Credits />);
  fireEvent.click(screen.getByRole("button", { name: "Credits" }));
  const dialog = screen.getByRole("dialog", { name: "Credits" });
  vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({ left: 100, right: 500, top: 100, bottom: 400 } as DOMRect);
  fireEvent.click(within(dialog).getByRole("heading", { name: "City data" }));
  fireEvent.click(dialog, { clientX: 150, clientY: 150 });
  expect(dialog).toHaveAttribute("open");
  fireEvent.click(dialog, { clientX: 50, clientY: 50 });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Credits" })).toHaveFocus();
});

it("wraps keyboard focus between the close button and final source link", () => {
  render(<Credits />);
  fireEvent.click(screen.getByRole("button", { name: "Credits" }));
  const close = screen.getByRole("button", { name: "Close credits" });
  const source = screen.getByRole("link", { name: /^Source data and documentation/ });
  close.focus();
  fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
  expect(source).toHaveFocus();
  fireEvent.keyDown(source, { key: "Tab" });
  expect(close).toHaveFocus();
});
