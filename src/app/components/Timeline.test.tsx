import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Timeline } from "./Timeline";
import { TimezoneRow } from "./TimezoneRow";
import { getAbbreviation } from "../../utils/timezoneUtils";

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(2500);
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(2500);
});
afterEach(() => vi.restoreAllMocks());

function renderRail(overrides: Partial<React.ComponentProps<typeof Timeline>> = {}) {
  return render(<Timeline now={new Date("2026-03-07T18:15:00Z")} timezone="Asia/Kathmandu" isLive={false} selectedDateOffset={1} use24Hour {...overrides} />);
}

it("renders all 25 exact Kathmandu day cells without rounding", () => {
  const { container } = renderRail();
  const cells = container.querySelectorAll("[data-timeline-cell]");
  expect(cells).toHaveLength(25);
  expect(cells[0]).toHaveAttribute("data-instant", "2026-03-07T18:15:00.000Z");
  expect(cells[0]).toHaveTextContent("0");
  expect(screen.getByTestId("timeline-rail")).toHaveAttribute("data-start", "2026-03-07T18:15:00.000Z");
  expect(cells[24]).toHaveAttribute("data-instant", "2026-03-08T18:15:00.000Z");
  expect(container.querySelector('[data-date-boundary="2026-03-08"]')).toHaveClass("hidden");
});

it("positions actual fractional midnight and label instead of treating 00:45 as midnight", () => {
  const { container } = renderRail({ timezone: "Asia/Kolkata" });
  const midnight = container.querySelector('[data-date-boundary="2026-03-08"]');
  expect(midnight).toHaveAttribute("data-boundary-index", "0.25");
  expect(midnight).toHaveStyle({ left: "1%" });
  expect(midnight).not.toHaveClass("hidden");
  expect(container.querySelector('[data-date-label="2026-03-08"]')).toHaveStyle({ left: "25px" });
  expect(container.querySelector('[data-timeline-cell="1"]')).toHaveTextContent("0:45");
  expect(container.querySelector('[data-date-boundary][data-boundary-index="1"]')).toBeNull();
});

it("positions date boundaries inside the final cell and excludes the right endpoint", () => {
  const { container, rerender } = renderRail({ now: new Date("2026-03-07T23:30:00Z"), timezone: "UTC" });
  const final = container.querySelector('[data-date-boundary="2026-03-09"]');
  expect(final).toHaveAttribute("data-boundary-index", "24.5");
  expect(final).toHaveStyle({ left: "98%" });
  expect(container.querySelector('[data-date-label="2026-03-09"]')).toHaveStyle({ left: "2450px" });
  rerender(<Timeline now={new Date("2026-03-07T23:00:00Z")} timezone="UTC" isLive={false} selectedDateOffset={1} use24Hour />);
  expect(container.querySelector('[data-date-boundary="2026-03-09"]')).toBeNull();
});

it("keeps an initial date-segment label separate from a real midnight divider", () => {
  const { container } = renderRail({ now: new Date("2026-03-08T12:00:00Z"), timezone: "UTC" });
  expect(container.querySelector('[data-date-label="2026-03-08"]')).toHaveStyle({ left: "0px" });
  expect(container.querySelector('[data-date-boundary="2026-03-08"]')).toBeNull();
  expect(container.querySelector('[data-date-boundary="2026-03-09"]')).toHaveAttribute("data-boundary-index", "12");
});

it("renders Kolkata 02:30 correctly in the real row, marker and rail during the Vancouver DST gap", () => {
  const now = new Date("2026-03-07T21:00:00Z");
  const { container } = render(<TimezoneRow config={{ id: "india", timezone: "Asia/Kolkata", isHome: true }} now={now} timelineTime={now}
    onRemove={vi.fn()} onRename={vi.fn()} onMove={vi.fn()} onSetHome={vi.fn()} use24Hour showBadge showWeekends
    hoveredHourIndex={null} onHoverHour={vi.fn()} isLive selectedDateOffset={0} />);
  expect(screen.getByTestId("row-clock")).toHaveTextContent("02:30");
  expect(screen.getByTestId("row-clock").parentElement).toHaveTextContent("Sun, Mar 8");
  expect(screen.getByTestId("current-marker")).toHaveTextContent("2:30");
  expect(screen.getByTestId("current-marker")).toHaveStyle({ left: "1250px" });
  expect(container.querySelector('[data-timeline-cell="12"]')).toHaveTextContent("2:30");
  expect(container.querySelector('[data-timeline-cell="12"]')).toHaveAttribute("title", expect.stringContaining("UTC+05:30"));
  expect(getAbbreviation(now, "Asia/Kolkata")).toBe("GMT+5:30");
});

it("exposes repeated-hour offsets and exact instants in rendered accessible cell names", () => {
  renderRail({ now: new Date("2026-11-01T12:00:00Z"), timezone: "America/New_York", isLive: true });
  expect(screen.getByRole("group", { name: "2026-11-01 1:00 UTC-04:00 (2026-11-01T05:00:00.000Z)" })).toHaveTextContent("1");
  expect(screen.getByRole("group", { name: "2026-11-01 1:00 UTC-05:00 (2026-11-01T06:00:00.000Z)" })).toHaveTextContent("1");
  expect(screen.getAllByRole("group")).toHaveLength(25);
});

it("shares hover indices and live anchor/marker geometry between rows", () => {
  function Pair() {
    const [hovered, setHovered] = useState<number | null>(null);
    return <>{["UTC", "Asia/Kathmandu"].map((timezone) => <Timeline key={timezone} now={new Date("2026-03-07T21:15:00Z")} timezone={timezone}
      isLive selectedDateOffset={0} use24Hour hoveredHourIndex={hovered} onHoverHour={setHovered} />)}</>;
  }
  const { container } = render(<Pair />);
  const cells = container.querySelectorAll('[data-timeline-cell="5"]');
  fireEvent.mouseEnter(cells[0]);
  for (const cell of cells) expect(cell).toHaveStyle({ background: "var(--dt-surface-highlight)" });
  for (const marker of screen.getAllByTestId("current-marker")) expect(marker).toHaveStyle({ left: "1250px" });
  for (const rail of screen.getAllByTestId("timeline-rail")) {
    expect(rail).toHaveAttribute("data-start", "2026-03-07T09:00:00.000Z");
    expect(rail.style.transform).toBe("translateX(-49%)");
  }
  fireEvent.mouseLeave(cells[0]);
  for (const cell of cells) expect(cell).not.toHaveStyle({ background: "var(--dt-surface-highlight)" });
});


it.each([
  ["America/Santiago", "2026-09-06T04:00:00Z", "1", 23],
  ["America/Havana", "2026-11-01T04:00:00Z", "0", 25],
  ["Australia/Lord_Howe", "2026-10-03T13:30:00Z", "0", 23.5],
  ["Australia/Lord_Howe", "2026-04-04T13:00:00Z", "0", 24.5],
])("renders exact date starts and boundaries in %s at %s", (timezone, instant, firstLabel, nextIndex) => {
  const { container } = renderRail({ now: new Date(instant), timezone });
  expect(screen.getByTestId("timeline-rail")).toHaveAttribute("data-start", new Date(instant).toISOString());
  expect(container.querySelector('[data-timeline-cell="0"]')).toHaveTextContent(firstLabel);
  const boundaries = container.querySelectorAll("[data-date-boundary]");
  if (nextIndex < 25) {
    expect(boundaries[1]).toHaveAttribute("data-boundary-index", String(nextIndex));
    expect(boundaries[1]).toHaveStyle({ left: `${nextIndex / 25 * 100}%` });
  } else {
    expect(boundaries).toHaveLength(1);
    const first = container.querySelector('[data-timeline-cell="0"]')!;
    const second = container.querySelector('[data-timeline-cell="1"]')!;
    expect(first).toHaveAttribute("title", expect.stringContaining("UTC-04:00"));
    expect(second).toHaveAttribute("title", expect.stringContaining("UTC-05:00"));
  }
});

it("renders the missing New York spring hour as an instant jump from 1 to 3", () => {
  renderRail({ now: new Date("2026-03-08T12:00:00Z"), timezone: "America/New_York", isLive: true });
  expect(screen.getByRole("group", { name: "2026-03-08 1:00 UTC-05:00 (2026-03-08T06:00:00.000Z)" })).toHaveTextContent("1");
  expect(screen.getByRole("group", { name: "2026-03-08 3:00 UTC-04:00 (2026-03-08T07:00:00.000Z)" })).toHaveTextContent("3");
  expect(screen.queryByRole("group", { name: /^2026-03-08 2:00/ })).not.toBeInTheDocument();
});
