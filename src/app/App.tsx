import { initializeTheme } from "../utils/theme";
import { useTheme } from "../hooks/useTheme";
import { formatZonedClock, PAN_LIMIT_HOURS } from "../utils/timeline";
import { canonicalTimezone } from "../utils/bundledTimezones";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Clock, X } from "lucide-react";
import { useAnalytics } from "../analytics/AnalyticsProvider";
import { pickerCity, pickerResultId } from "../utils/cityCatalog";
import { settingsChanges } from "../analytics/structuredEvents";
import { useTime } from "../hooks/useTime";
import { usePersistentState } from "../hooks/useStorage";
import {
  DEFAULT_SETTINGS,
  parseAppSettings,
  parseTimezoneConfig,
  parseNoticeDismissed,
} from "../utils/persistence";
import {
  TimezoneConfig,
  AppSettings,
  getCityName,
} from "../utils/timezoneUtils";
import { LIVE_SELECTION, calendarDifference, getZonedFields, HOUR_MS, onCalendarDate, startOfCalendarDate, type DateSelection } from "../utils/calendarDate";
import { TimezoneRow } from "./components/TimezoneRow";
import { AddTimezone } from "./components/AddTimezone";
import { DatePicker } from "./components/DatePicker";
import { SettingsMenu } from "./components/SettingsMenu";
import {
  MotionConfig,
  motion,
  AnimatePresence,
  LayoutGroup,
} from "motion/react";
import { registerSquircle } from "../utils/squircle";
import Daybound from "../imports/Daybound";

// Register the squircle paint worklet for smooth corners (idempotent)
registerSquircle();

// Paint the saved theme before React’s first render.
initializeTheme();

function App() {
  const now = useTime();
  const [timezones, setTimezones, timezonePersistence] =
    usePersistentState<TimezoneConfig[]>("timezone_config", [], parseTimezoneConfig);
  const [settings, setSettings, settingsPersistence] =
    usePersistentState<AppSettings>(
      "app_settings",
      DEFAULT_SETTINGS,
      parseAppSettings,
    );
  const [localSaveNoticeDismissed, setLocalSaveNoticeDismissed, noticePersistence] =
    usePersistentState<boolean>(
      "local_save_notice_dismissed",
      false,
      parseNoticeDismissed,
    );

  const savingUnavailable = [timezonePersistence, settingsPersistence, noticePersistence].includes("unavailable");
  useTheme(settings);

  const { capture } = useAnalytics();

  const handleSettingsChange = useCallback((next: AppSettings) => {
    setSettings(next);
    for (const event of settingsChanges(settings, next)) capture("settings_changed", event);
  }, [capture, settings, setSettings]);

  const [initialized, setInitialized] = useState(false);
  // A selected clock instant is independent of the shared rail's browsing position.
  const [view, setView] = useState<{
    base: number; hours: number; centered: boolean; selected: number | null; calendarTime: number;
  } | null>(null);
  const [dateFeedback, setDateFeedback] = useState("");
  const [hoveredHourIndex, setHoveredHourIndex] = useState<
    number | null
  >(null);

  const homeTimezone =
    timezones.find((t) => t.isHome)?.timezone ||
    timezones[0]?.timezone ||
    canonicalTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone) || "UTC";
  const homeToday = getZonedFields(now, homeTimezone).date;
  const clockTime = view?.selected != null ? new Date(view.selected) : now;
  const timelineTime = view ? new Date(view.base) : now;
  const isLive = view?.centered ?? true;
  const surfacedSelection: DateSelection = view
    ? { mode: "date", date: getZonedFields(view.calendarTime, homeTimezone).date }
    : LIVE_SELECTION;
  const selectedDateOffset = surfacedSelection.mode === "date" ? calendarDifference(surfacedSelection.date, homeToday) : 0;
  const nowTime = now.getTime();
  const handlePanTimeline = useCallback((delta: number) => {
    if (!Number.isFinite(delta)) return;
    setView(previous => {
      const origin = previous ?? { base: nowTime, hours: 0, centered: true, selected: null, calendarTime: nowTime };
      const hours = Math.max(-PAN_LIMIT_HOURS, Math.min(PAN_LIMIT_HOURS, origin.hours + delta));
      return { ...origin, hours, calendarTime: Math.trunc(origin.base + hours * HOUR_MS) };
    });
    setHoveredHourIndex(null);
  }, [nowTime]);
  const handleSelectTime = useCallback((instant: number) => {
    setView(previous => {
      if (previous?.selected != null && previous.selected >= instant && previous.selected < instant + HOUR_MS) {
        return { ...previous, selected: null };
      }
      return {
        ...(previous ?? { base: nowTime, hours: 0, centered: true }),
        selected: instant, calendarTime: instant,
      };
    });
    setHoveredHourIndex(null);
  }, [nowTime]);
  const returnToNow = useCallback(() => {
    setView(null);
    setHoveredHourIndex(null);
    document.querySelector<HTMLButtonElement>('[aria-current="date"]')?.focus();
  }, []);

  const timezoneIds = useMemo(() => timezones.map((timezone) => timezone.timezone), [timezones]);

  const handleSelectDate = useCallback((next: DateSelection) => {
    if (next.mode === "live") {
      setView(null);
      setDateFeedback("");
      setHoveredHourIndex(null);
      return;
    }
    const start = startOfCalendarDate(next.date, homeTimezone);
    if (start === null) {
      setDateFeedback("This date does not exist in the home timezone. Choose another date.");
      return;
    }
    setDateFeedback("");
    const selected = onCalendarDate(next.date, view?.selected ?? nowTime, homeTimezone);
    setView({ base: start.getTime(), hours: 0, centered: false, selected, calendarTime: selected });
    setHoveredHourIndex(null);
  }, [homeTimezone, nowTime, view?.selected]);

  // Initialize default timezone if empty
  useEffect(() => {
    if (!initialized) {
      if (timezones.length === 0) {
        try {
          const localZone =
            canonicalTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone) || "UTC";
          const newTimezone: TimezoneConfig = {
            id: crypto.randomUUID(),
            timezone: localZone,
            isHome: true,
          };
          setTimezones([newTimezone]);
        } catch (e) {
          console.error("Failed to detect timezone", e);
        }
      }
      setInitialized(true);
    }
  }, [
    timezones.length,
    initialized,
    setTimezones,
  ]);

  const handleAddTimezone = useCallback((
    timezone: string,
    label?: string,
  ) => {
    // Avoid duplicates
    if (timezones.some((tz) => tz.timezone === timezone))
      return;

    const standardCity = pickerCity(pickerResultId(timezone, label ?? getCityName(timezone)));
    const newTimezone: TimezoneConfig = {
      id: crypto.randomUUID(),
      timezone,
      isHome: false,
      ...(label ? { label } : {}),
      ...(standardCity ? { city: standardCity.name } : {}),
    };
    const updated = [...timezones, newTimezone];
    setTimezones((previous) => previous.some((row) => row.timezone === timezone) ? previous : [...previous, newTimezone]);
    capture("timezone_added", { timezone_count_after: updated.length });
  }, [capture, setTimezones, timezones]);

  const handleRemoveTimezone = useCallback((id: string) => {
    const updated = timezones.filter((tz) => tz.id !== id);
    setTimezones((previous) => previous.filter((row) => row.id !== id));
    capture("timezone_removed", { timezone_count_after: updated.length });
  }, [capture, setTimezones, timezones]);

  const handleRename = useCallback((id: string, newLabel: string) => {
    setTimezones((previous) =>
      previous.map((tz) =>
        tz.id === id ? { ...tz, label: newLabel } : tz,
      ),
    );
    capture("timezone_renamed");
  }, [capture, setTimezones]);

  const moveTimezone = useCallback((
    id: string,
    direction: "up" | "down",
  ) => {
    const index = timezones.findIndex((tz) => tz.id === id);
    if (index === -1) return;

    const newTimezones = [...timezones];
    if (direction === "up" && index > 0) {
      [newTimezones[index], newTimezones[index - 1]] = [
        newTimezones[index - 1],
        newTimezones[index],
      ];
    } else if (
      direction === "down" &&
      index < newTimezones.length - 1
    ) {
      [newTimezones[index], newTimezones[index + 1]] = [
        newTimezones[index + 1],
        newTimezones[index],
      ];
    }
    setTimezones(newTimezones);
    capture("timezone_reordered", { direction });
  }, [capture, setTimezones, timezones]);

  const handleSetHome = useCallback((id: string) => {
    const newTimezones = timezones.map((tz) => ({
      ...tz,
      isHome: tz.id === id,
    }));
    
    // Move new home to top
    const homeTz = newTimezones.find((tz) => tz.id === id);
    const others = newTimezones.filter((tz) => tz.id !== id);
    
    if (homeTz) {
      setTimezones([homeTz, ...others]);
      setView(previous => previous?.selected != null ? { ...previous, calendarTime: previous.selected } : null);
      if (!timezones.find((tz) => tz.id === id)?.isHome) {
        const city = homeTz.city ? pickerCity(pickerResultId(homeTz.timezone, homeTz.city)) : undefined;
        capture("home_timezone_changed", { reference_timezone: homeTz.timezone,
          ...(city ? { reference_result_id: city.id } : {}) });
      }
    }
  }, [capture, setTimezones, timezones]);

  // Render main app
  return (
    <MotionConfig reducedMotion="user">
      {/* Fixed background layer — guarantees the entire viewport
          (including behind iOS safe areas / Android nav bar)
          is painted with the correct theme background color. */}
      <div
        className="fixed inset-0 bg-[var(--dt-bg)] transition-colors duration-200"
        style={{ zIndex: -1 }}
        aria-hidden="true"
      />
      <div className="min-h-dvh bg-[var(--dt-bg)] text-[var(--dt-text)] transition-colors duration-200 text-[clamp(16px,0.96vw+6.15px,18px)] flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)", paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}>
        {/* Main Content */}
        <main className="max-w-[1920px] w-full mx-auto px-[clamp(8px,2.5vw,32px)] py-[clamp(16px,5vw,64px)] flex-grow flex flex-col gap-[1em]">
          
          {/* Header */}
          <div className="flex flex-col gap-6">
            <div className="flex-shrink-0 md:hidden flex justify-center pt-1">
              <Daybound className="h-8 text-[var(--dt-logo)] transition-colors aspect-[347/68]" />
            </div>

            <div className="flex flex-col md:flex-row items-stretch gap-[1em] md:gap-[1.5em]">
              <div className="flex-shrink-0 w-full md:w-auto">
                <AddTimezone
                  onAdd={handleAddTimezone}
                  existingTimezones={timezoneIds}
                />
              </div>

              {/* Group Date Picker and Settings for better mobile layout */}
              <div className="flex flex-row items-stretch gap-[0.5em] flex-grow min-w-0">
                <DatePicker
                  selection={surfacedSelection}
                  onSelectDate={handleSelectDate}
                  now={now}
                  homeTimezone={homeTimezone}
                />

                {/* Right Actions */}
                <div className="flex-shrink-0 flex items-stretch md:ml-auto">
                  <SettingsMenu
                    settings={settings}
                    onSettingsChange={handleSettingsChange}
                    timezones={timezones}
                    onSetHome={handleSetHome}
                  />
                </div>
              </div>
            </div>
          </div>

          <div role="status" aria-label="Local save status" className={savingUnavailable || !localSaveNoticeDismissed ? undefined : "sr-only"}>
            {(savingUnavailable || !localSaveNoticeDismissed) && (
              <div
                className="flex items-center gap-[0.625em] p-[0.75em] bg-[var(--dt-accent-wash)] rounded-sm text-[var(--dt-text-secondary)]"
              >
                <span className="flex-grow text-[clamp(12px,0.6vw+9px,14px)] leading-normal">
                  {savingUnavailable
                    ? "Changes work for this visit, but cannot be saved on this device."
                    : "Your changes are saved locally on this device. You can close this page and come back anytime."}
                </span>
                {!savingUnavailable && <button
                  type="button"
                  aria-label="Dismiss local save notice"
                  onClick={() => setLocalSaveNoticeDismissed(true)}
                  className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--dt-text-muted)] hover:text-[var(--dt-text)] hover:bg-[var(--dt-bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dt-accent)] transition-colors"
                >
                  <X size={16} />
                </button>}
              </div>
            )}
          </div>

          {dateFeedback && <p role="status" className="text-sm text-[var(--dt-text-secondary)]">{dateFeedback}</p>}
          <p role="status" aria-label="Selected time" className="sr-only">
            {view?.selected != null ? `${getZonedFields(view.selected, homeTimezone).date}, ${formatZonedClock(clockTime, homeTimezone, settings.use24Hour)} in ${getCityName(homeTimezone)}. All city clocks show this moment.` : "Showing live time."}
          </p>
          <div className="divide-y divide-[var(--dt-border)]">
            {timezones.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-12 h-12 bg-[var(--dt-surface)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--dt-text-muted)]">
                  <Clock size={24} />
                </div>
                <p className="font-medium text-[var(--dt-text)] mb-1 text-[1.1em]">
                  No timezones added
                </p>
                <p className="text-[var(--dt-text-secondary)] text-[0.9em]">
                  Press{" "}
                  <kbd className="border border-[var(--dt-border-strong)] px-1 rounded bg-[var(--dt-kbd-bg)] text-[0.9em]">
                    K
                  </kbd>{" "}
                  or use the search bar to add one.
                </p>
              </div>
            ) : (
            <LayoutGroup>
                <AnimatePresence>
                  {timezones.map((tz, index) => (
                    <motion.div
                      key={tz.id}
                      layout="position"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        y: 8,
                        transition: {
                          duration: 0.15,
                          ease: [0.4, 0, 1, 1],
                        },
                      }}
                      transition={{
                        layout: {
                          duration: 0.25,
                          ease: [0.4, 0, 0.2, 1],
                        },
                        duration: 0.3,
                        ease: [0, 0, 0.2, 1],
                      }}
                    >
                      <TimezoneRow
                        config={tz}
                        now={clockTime}
                        timelineTime={timelineTime}
                        panHours={view?.hours ?? 0}
                        selectedTime={view?.selected ?? undefined}
                        onSelectTime={handleSelectTime}
                        onPan={handlePanTimeline}
                        onResetTimeline={returnToNow}
                        onRemove={handleRemoveTimezone}
                        onRename={handleRename}
                        onMove={moveTimezone}
                        onSetHome={handleSetHome}
                        isHome={tz.isHome}
                        homeTimezone={
                          timezones.find((t) => t.isHome)
                            ?.timezone || timezones[0]?.timezone
                        }
                        isFirst={index === 0}
                        isLast={index === timezones.length - 1}
                        use24Hour={settings.use24Hour}
                        showBadge={settings.showBadge ?? true}
                        showWeekends={
                          settings.showWeekends ?? false
                        }
                        hoveredHourIndex={hoveredHourIndex}
                        onHoverHour={setHoveredHourIndex}
                        isLive={isLive}
                        selectedDateOffset={selectedDateOffset}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </LayoutGroup>
            )}
          </div>
          <div className="hidden md:flex justify-center flex-grow items-end pt-6">
            <Daybound className="h-8 text-[var(--dt-logo)] transition-colors opacity-50 hover:opacity-100 aspect-[347/68]" />
          </div>
        </main>
      </div>
    </MotionConfig>
  );
}

export default App;
