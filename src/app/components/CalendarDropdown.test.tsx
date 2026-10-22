import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarDropdown } from "./CalendarDropdown";

vi.mock("@posthog/react", () => ({ usePostHog: () => null }));

const NOW = new Date("2026-03-02T14:30:00Z");

function renderCalendar(overrides: Partial<React.ComponentProps<typeof CalendarDropdown>> = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    onSelectDate: vi.fn(),
    selectedDateOffset: 0,
    homeTimezone: "UTC",
    now: NOW,
    ...overrides,
  };
  const view = render(<CalendarDropdown {...props} />);
  return {
    ...view,
    props,
    update: (changes: Partial<typeof props>) => {
      Object.assign(props, changes);
      view.rerender(<CalendarDropdown {...props} />);
    },
  };
}

describe("calendar opening and clock updates", () => {
  it("keeps the browsed month after one second and one minute", async () => {
    const user = userEvent.setup();
    const { update } = renderCalendar();
    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByText("April 2026")).toBeInTheDocument();
    update({ now: new Date("2026-03-02T14:30:01Z") });
    expect(screen.getByText("April 2026")).toBeInTheDocument();
    update({ now: new Date("2026-03-02T14:31:00Z") });
    expect(screen.getByText("April 2026")).toBeInTheDocument();
  });

  it("opens and reopens in the far-future selected month", async () => {
    const user = userEvent.setup();
    const { update } = renderCalendar({ selectedDateOffset: 100 });
    expect(screen.getByText("June 2026")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByText("July 2026")).toBeInTheDocument();
    update({ isOpen: false });
    update({ isOpen: true });
    expect(screen.getByText("June 2026")).toBeInTheDocument();
  });

  it("reconciles an intentional selected offset change", async () => {
    const user = userEvent.setup();
    const { update } = renderCalendar();
    await user.click(screen.getByRole("button", { name: "Next month" }));
    update({ selectedDateOffset: 100 });
    expect(screen.getByText("June 2026")).toBeInTheDocument();
  });

  it("reconciles an intentional home timezone change", async () => {
    const user = userEvent.setup();
    const { update } = renderCalendar({ now: new Date("2026-03-31T23:30:00Z") });
    await user.click(screen.getByRole("button", { name: "Next month" }));
    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByText("May 2026")).toBeInTheDocument();
    update({ homeTimezone: "Asia/Tokyo" });
    expect(screen.getByText("April 2026")).toBeInTheDocument();
  });

  it("preserves browsing when home midnight crosses a month boundary", async () => {
    const user = userEvent.setup();
    const { update } = renderCalendar({ now: new Date("2026-03-31T23:59:59Z") });
    await user.click(screen.getByRole("button", { name: "Next month" }));
    await user.click(screen.getByRole("button", { name: "Next month" }));
    update({ now: new Date("2026-04-01T00:00:00Z") });
    expect(screen.getByText("May 2026")).toBeInTheDocument();
  });

  it("updates past-day disabling at midnight without requiring reopening", () => {
    const { update } = renderCalendar({ now: new Date("2026-03-02T23:59:59Z") });
    expect(screen.getByRole("button", { name: "Monday, March 2, 2026" })).toHaveAttribute("aria-disabled", "false");
    update({ now: new Date("2026-03-03T00:00:00Z") });
    const yesterday = screen.getByRole("button", { name: "Monday, March 2, 2026" });
    expect(yesterday).toHaveAttribute("aria-disabled", "true");
    expect(yesterday).toHaveAttribute("tabindex", "-1");
  });

  it("retains Escape, outside click, date selection and Today close methods", async () => {
    const user = userEvent.setup();
    const { props } = renderCalendar();
    await user.keyboard("{Escape}");
    expect(props.onClose).toHaveBeenLastCalledWith("escape");
    fireEvent.mouseDown(document.body);
    expect(props.onClose).toHaveBeenLastCalledWith("outside_click");
    await user.click(screen.getByRole("button", { name: "Tuesday, March 3, 2026" }));
    expect(props.onSelectDate).toHaveBeenLastCalledWith(1);
    expect(props.onClose).toHaveBeenLastCalledWith("date_selected");
    await user.click(screen.getByRole("button", { name: "Today" }));
    expect(props.onSelectDate).toHaveBeenLastCalledWith(0);
    expect(props.onClose).toHaveBeenLastCalledWith("today_button");
  });
});
