import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAnalytics } from "../../analytics/AnalyticsProvider";
import { motion, AnimatePresence } from "motion/react";
import { EASE_OUT, EASE_IN } from "../../utils/animation";
import { addCalendarMonths, calendarMonthDays, calendarSurrogate, formatCalendarDate, getZonedFields, LIVE_SELECTION, startOfCalendarDate, startOfCalendarMonth, type DateSelection } from "../../utils/calendarDate";

interface CalendarDropdownProps {
  isOpen: boolean;
  onClose: (
    method:
      | "outside_click"
      | "escape"
      | "date_selected"
      | "today_button",
  ) => void;
  onSelectDate: (selection: DateSelection) => void;
  selection: DateSelection;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  homeTimezone: string;
  now: Date;
}

const DAY_HEADERS = ["M", "T", "W", "T", "F", "S", "S"];

export const CalendarDropdown: React.FC<CalendarDropdownProps> = ({
  isOpen,
  onClose,
  onSelectDate,
  selection,
  containerRef,
  homeTimezone,
  now,
}) => {
  const { capture } = useAnalytics();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const today = getZonedFields(now, homeTimezone).date;
  const selectedDate = selection.mode === "date" ? selection.date : today;
  const selectedMonth = startOfCalendarMonth(selectedDate);
  const selectionKey = selection.mode === "live" ? "live" : selection.date;
  const [viewingMonth, setViewingMonth] = useState(selectedMonth);
  const previousContext = useRef({ isOpen: false, homeTimezone, selectionKey });
  const isViewingCurrentMonth = viewingMonth <= startOfCalendarMonth(today);

  useEffect(() => {
    const previous = previousContext.current;
    if (isOpen && (!previous.isOpen || previous.homeTimezone !== homeTimezone || previous.selectionKey !== selectionKey)) {
      setViewingMonth(selectedMonth);
    }
    previousContext.current = { isOpen, homeTimezone, selectionKey };
  }, [isOpen, homeTimezone, selectionKey, selectedMonth]);

  useEffect(() => {
    if (!isOpen) return;
    const outsideRef = containerRef || wrapperRef;
    function handleClickOutside(event: MouseEvent) {
      if (
        outsideRef.current &&
        !outsideRef.current.contains(event.target as Node)
      ) {
        onClose("outside_click");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
  }, [isOpen, onClose, containerRef]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose("escape");
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () =>
      document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const days = calendarMonthDays(viewingMonth).map((date) => ({
    date, unavailable: startOfCalendarDate(date, homeTimezone) === null,
  }));
  const leadingBlanks = (calendarSurrogate(viewingMonth).getUTCDay() + 6) % 7;

  const handleDayClick = (day: string, unavailable: boolean) => {
    if (day < today || unavailable) return;
    onSelectDate({ mode: "date", date: day });
    onClose("date_selected");
  };

  const handleTodayClick = () => {
    onSelectDate(LIVE_SELECTION);
    onClose("today_button");
  };

  const monthsFromToday = (month: string) =>
    (Number(month.slice(0, 4)) - Number(today.slice(0, 4))) * 12 +
    Number(month.slice(5, 7)) - Number(today.slice(5, 7));

  const handlePrevMonth = () => {
    const newMonth = addCalendarMonths(viewingMonth, -1);
    setViewingMonth(newMonth);
    capture("calendar_month_navigated", {
      direction: "backward",
      months_from_today: monthsFromToday(newMonth),
    });
  };

  const handleNextMonth = () => {
    const newMonth = addCalendarMonths(viewingMonth, 1);
    setViewingMonth(newMonth);
    capture("calendar_month_navigated", {
      direction: "forward",
      months_from_today: monthsFromToday(newMonth),
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={wrapperRef}
          className="absolute top-full right-0 mt-[0.5em] bg-[var(--dt-search-dropdown)] rounded-lg drop-shadow-xl border border-[var(--dt-border)] overflow-hidden z-50 ring-1 ring-black/5 min-w-[18em]"
          style={{ transformOrigin: "top" }}
          initial={{ opacity: 0, scaleY: 0.96, y: -4 }}
          animate={{
            opacity: 1,
            scaleY: 1,
            y: 0,
            transition: { duration: 0.2, ease: EASE_OUT },
          }}
          exit={{
            opacity: 0,
            scaleY: 0.96,
            y: -4,
            transition: { duration: 0.12, ease: EASE_IN },
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-[0.75em] py-[0.5em] border-b border-[var(--dt-border)]">
            <button
              onClick={handlePrevMonth}
              disabled={isViewingCurrentMonth}
              className={`p-[0.25em] rounded transition-colors ${
                isViewingCurrentMonth
                  ? "text-[var(--dt-text-muted)] opacity-40 cursor-not-allowed"
                  : "text-[var(--dt-text-secondary)] hover:bg-[var(--dt-bg-hover)]"
              }`}
              aria-label="Previous month"
            >
              <ChevronLeft size="1em" />
            </button>
            <span className="text-[clamp(12px,0.6vw+8px,14px)] font-medium text-[var(--dt-text)]">
              {formatCalendarDate(viewingMonth, { month: "long", year: "numeric" })}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-[0.25em] rounded text-[var(--dt-text-secondary)] hover:bg-[var(--dt-bg-hover)] transition-colors"
              aria-label="Next month"
            >
              <ChevronRight size="1em" />
            </button>
          </div>

          {/* Day grid */}
          <div className="px-[0.5em] py-[0.375em]">
            <div className="grid grid-cols-7 mb-[0.25em]">
              {DAY_HEADERS.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center w-[2.5em] h-[2em] text-[clamp(10px,0.5vw+7px,12px)] font-medium text-[var(--dt-text-muted)]"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <div key={`blank-${i}`} className="w-[2.5em] h-[2.5em]" />
              ))}

              {days.map(({ date: day, unavailable }) => {
                const isPast =
                  day < today;
                const isDayToday = day === today;
                const isSelected =
                  !isDayToday && day === selectedDate;

                let cellClass =
                  "flex items-center justify-center w-[2.5em] h-[2.5em] text-[clamp(12px,0.6vw+8px,14px)] transition-colors ";

                if (isPast || unavailable) {
                  cellClass +=
                    "text-[var(--dt-text-muted)] opacity-40 cursor-not-allowed";
                } else if (isDayToday) {
                  cellClass +=
                    "bg-[var(--dt-accent)] dark:bg-[color-mix(in_oklch,var(--dt-accent),black_30%)] text-[var(--dt-text-inverse)] rounded font-medium";
                } else if (isSelected) {
                  cellClass +=
                    "bg-[var(--dt-control-active)] text-[var(--dt-text)] drop-shadow-sm rounded font-medium ring-1 ring-[var(--dt-accent-70)] ring-inset";
                } else {
                  cellClass +=
                    "text-[var(--dt-text-secondary)] hover:bg-[var(--dt-bg-hover)] rounded cursor-pointer";
                }

                return (
                  <button
                    key={day}
                    className={cellClass}
                    onClick={() => handleDayClick(day, unavailable)}
                    aria-disabled={isPast || unavailable}
                    disabled={unavailable}
                    title={unavailable ? `This date does not exist in ${homeTimezone}. Choose another date.` : undefined}
                    aria-label={formatCalendarDate(day, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                    tabIndex={isPast || unavailable ? -1 : 0}
                  >
                    {Number(day.slice(8))}
                  </button>
                );
              })}
            </div>
          </div>

          {days.some((day) => day.unavailable) && (
            <p role="status" className="px-[0.75em] text-sm text-[var(--dt-text-secondary)]">
              Some dates do not exist in this timezone and cannot be selected.
            </p>
          )}
          {/* Footer */}
          <div className="flex justify-center px-[0.75em] py-[0.5em] border-t border-[var(--dt-border)]">
            <button
              onClick={handleTodayClick}
              className="text-[var(--dt-accent)] text-[clamp(11px,0.5vw+8px,13px)] font-medium hover:underline"
            >
              Today
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
