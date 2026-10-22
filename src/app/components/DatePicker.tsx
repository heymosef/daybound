import React, { useState, useRef, useCallback, useLayoutEffect } from "react";
import { CalendarDays, X } from "lucide-react";
import { usePostHog } from "@posthog/react";
import { addCalendarDays, calendarDifference, formatCalendarDate, getZonedFields, LIVE_SELECTION, startOfCalendarDate, type DateSelection } from "../../utils/calendarDate";
import { motion, AnimatePresence } from "motion/react";
import { EASE_OUT } from "../../utils/animation";
import { CalendarDropdown } from "./CalendarDropdown";

interface DatePickerProps {
  selection: DateSelection;
  onSelectDate: (selection: DateSelection) => void;
  now: Date;
  homeTimezone: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selection,
  onSelectDate,
  now,
  homeTimezone,
}) => {
  const posthog = usePostHog();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  const homeToday = getZonedFields(now, homeTimezone).date;
  const isLive = selection.mode === "live";
  const selectedDate = selection.mode === "date" ? selection.date : homeToday;
  const selectedDateOffset = calendarDifference(selectedDate, homeToday);

  useLayoutEffect(() => {
    const wrap = wrapperRef.current;
    const btn = firstButtonRef.current;
    if (!wrap || !btn) return;

    const measure = () => {
      const wrapRect = wrap.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const centerX = btnRect.left - wrapRect.left + btnRect.width / 2;
      wrap.style.setProperty("--indicator-left", `${centerX}px`);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const handleStripSelect = (offset: number) => {
    onSelectDate(offset === 0 ? LIVE_SELECTION : { mode: "date", date: addCalendarDays(homeToday, offset) });
    posthog?.capture("date_selected_strip", { date_offset: offset });
  };

  const handleCalendarSelect = useCallback(
    (next: DateSelection) => {
      const pickedDate = next.mode === "date" ? next.date : homeToday;
      const offset = calendarDifference(pickedDate, homeToday);
      const monthDistance = (Number(pickedDate.slice(0, 4)) - Number(homeToday.slice(0, 4))) * 12 +
        Number(pickedDate.slice(5, 7)) - Number(homeToday.slice(5, 7));
      onSelectDate(next);
      posthog?.capture("date_selected_calendar", { date_offset: offset, month_distance: monthDistance });
    },
    [onSelectDate, posthog, homeToday],
  );

  const handleCalendarClose = useCallback(
    (
      method:
        | "outside_click"
        | "escape"
        | "date_selected"
        | "today_button",
    ) => {
      setIsCalendarOpen(false);
      posthog?.capture("calendar_closed", { method });
    },
    [posthog],
  );

  const toggleCalendar = () => {
    if (isCalendarOpen) {
      setIsCalendarOpen(false);
    } else {
      setIsCalendarOpen(true);
      posthog?.capture("calendar_opened");
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-[0.25em] flex-grow md:flex-grow-0 min-w-0"
    >
      <div ref={wrapperRef} className="relative min-w-0" data-testid="strip-wrapper">
        <AnimatePresence mode="wait" initial={false}>
          {isLive ? (
            <motion.span
              key="today-pill"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="absolute top-0 -translate-x-1/2 -translate-y-[55%] z-10 pointer-events-none"
              style={{ left: "var(--indicator-left, 1.625em)" }}
              data-testid="today-indicator"
            >
              <span className="bg-[var(--dt-accent)] dark:bg-[color-mix(in_oklch,var(--dt-accent),black_30%)] text-[var(--dt-text-inverse)] text-[clamp(7px,0.35vw+5px,9px)] font-semibold uppercase tracking-wider px-[0.4em] py-[0.2em] rounded drop-shadow-sm leading-none whitespace-nowrap inline-block">
                Today
              </span>
            </motion.span>
          ) : (
            <motion.span
              key="today-dot"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="absolute top-0 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none w-[0.35em] h-[0.35em] rounded-full bg-[var(--dt-accent)] dark:bg-[color-mix(in_oklch,var(--dt-accent),black_30%)]"
              style={{ left: "var(--indicator-left, 1.625em)" }}
              data-testid="today-indicator"
            />
          )}
        </AnimatePresence>

        <div className="flex items-center p-[0.125em] bg-[var(--dt-control-bg)] rounded-md overflow-x-auto [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center min-w-max">
            {Array.from({ length: 7 }).map((_, i) => {
              const date = addCalendarDays(homeToday, i);
              const unavailable = startOfCalendarDate(date, homeTimezone) === null;
              const isSelected = i === selectedDateOffset;

              return (
                <button
                  key={i}
                  ref={i === 0 ? firstButtonRef : undefined}
                  onClick={() => handleStripSelect(i)}
                  disabled={unavailable}
                  title={unavailable ? `This date does not exist in ${homeTimezone}.` : undefined}
                  aria-current={i === 0 ? "date" : undefined}
                  className={`
                    flex flex-col items-center justify-center gap-[0.125em] px-[0.6em] py-[0.375em] rounded-sm transition-all duration-200 min-w-[3em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dt-accent)]
                    ${
                      isSelected
                        ? "bg-[var(--dt-control-active)] text-[var(--dt-text)] drop-shadow-sm"
                        : "text-[var(--dt-text-secondary)] hover:text-[var(--dt-text)]"
                    }
                  `}
                >
                  <span className="text-[clamp(13px,0.78vw+5px,16.25px)] font-medium leading-none">
                    {Number(date.slice(8))}
                  </span>
                  <span className="text-[clamp(10px,0.5vw+8px,12px)] leading-none font-medium opacity-90">
                    {formatCalendarDate(date, { month: "short" })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative h-full">
        <button
          onClick={toggleCalendar}
          className="flex items-center justify-center p-[0.5em] bg-[var(--dt-control-bg)] rounded-md transition-all duration-200 text-[var(--dt-text-secondary)] hover:text-[var(--dt-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dt-accent)] h-full min-w-[2.5em]"
          aria-label="Open calendar"
          aria-expanded={isCalendarOpen}
        >
          <CalendarDays size="1.125em" />
        </button>

        <CalendarDropdown
          isOpen={isCalendarOpen}
          onClose={handleCalendarClose}
          onSelectDate={handleCalendarSelect}
          selection={selection}
          containerRef={containerRef}
          homeTimezone={homeTimezone}
          now={now}
        />
      </div>

      {selectedDateOffset > 6 && (() => {
        const viewingDate = selectedDate;
        return (
        <button
          type="button"
          onClick={() => {
            onSelectDate(LIVE_SELECTION);
            posthog?.capture("date_selected_strip", { date_offset: 0 });
          }}
          aria-label="Back to today"
          className="flex items-center gap-[0.25em] px-[0.5em] py-[0.25em] bg-[var(--dt-accent-wash)] border border-[var(--dt-accent-70)] rounded-md flex-shrink-0 h-full transition-all duration-200 text-[var(--dt-accent)] hover:bg-[var(--dt-accent-70)] hover:text-[var(--dt-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dt-accent)]"
        >
          <div className="flex flex-col items-center justify-center gap-[0.125em] min-w-[2em]">
            <span className="text-[clamp(13px,0.78vw+5px,16.25px)] font-medium leading-none">
              {Number(viewingDate.slice(8))}
            </span>
            <span className="text-[clamp(10px,0.5vw+8px,12px)] leading-none font-medium opacity-90">
              {formatCalendarDate(viewingDate, { month: "short" })}
            </span>
          </div>
          <X size="1.125em" />
        </button>
        );
      })()}

    </div>
  );
};
