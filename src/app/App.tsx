import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Clock, X } from "lucide-react";
import { useAnalytics } from "../analytics/AnalyticsProvider";
import { pickerCity, pickerResultId } from "../analytics/searchCatalog";
import { settingsChanges } from "../analytics/structuredEvents";
import { useTime } from "../hooks/useTime";
import { usePersistentState } from "../hooks/useStorage";
import {
  DEFAULT_SETTINGS,
  parseAppSettings,
  parseTimezoneConfig,
  parseNoticeDismissed,
  readPersistentValue,
} from "../utils/persistence";
import {
  TimezoneConfig,
  AppSettings,
  getCityName,
} from "../utils/timezoneUtils";
import { LIVE_SELECTION, calendarDifference, getZonedFields, isCalendarDate, startOfCalendarDate, type DateSelection } from "../utils/calendarDate";
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

// ── Theme color map (hex only – must match CSS hex fallbacks in theme.css) ──
const THEME_COLORS: Record<string, { light: string; dark: string }> = {
  gamut: { light: "#ffffff", dark: "#292929" },
  "te-1": { light: "#ececec", dark: "#333333" },
  dos: { light: "#f4f9f4", dark: "#022c22" },
};

/**
 * Compute the resolved theme color hex for a given designTheme + mode.
 * Always returns a 7-char hex like "#333333".
 */
function resolveThemeColor(
  designTheme: string,
  mode: "light" | "dark" | "system"
): string {
  const palette = THEME_COLORS[designTheme] || THEME_COLORS["gamut"];
  const isSystemDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = mode === "dark" || (mode === "system" && isSystemDark);
  return isDark ? palette.dark : palette.light;
}

/**
 * Aggressively set/replace the <meta name="theme-color"> tag and paint
 * html + body backgrounds so that iOS Safari / Android Chrome system bars
 * always match the app background. Removes ALL existing theme-color tags
 * to avoid conflicts, then inserts a fresh one at the top of <head>.
 */
function applySystemBarColor(color: string) {
  // 1. Remove every existing theme-color meta (there may be several)
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((el) => el.remove());

  // 2. Create a fresh tag and prepend it so Safari reads it first
  const meta = document.createElement("meta");
  meta.setAttribute("name", "theme-color");
  meta.setAttribute("content", color);
  document.head.prepend(meta);

  // 3. Paint html + body inline so overscroll / safe-area gaps match
  document.documentElement.style.backgroundColor = color;
  document.body.style.backgroundColor = color;
}

// ── SYNCHRONOUS pre-React initialisation ──────────────────────────────
// Runs once when the module is first imported (before any component
// renders) so Safari sees the meta tag at first-contentful-paint.
(function earlyThemeInit() {
  try {
    // Read persisted settings from localStorage (same key as usePersistentState)
    const { value: saved } = readPersistentValue("app_settings", DEFAULT_SETTINGS, parseAppSettings);
    const designTheme = saved.designTheme || "te-1";
    const mode = saved.theme || "system";

    // Resolve whether dark mode
    const isSystemDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const isDark =
      mode === "dark" || (mode === "system" && isSystemDark);

    // 1. Apply dark class on <html>
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // 2. Set the design-theme data attribute so CSS variables resolve
    document.documentElement.setAttribute(
      "data-design-theme",
      designTheme
    );

    // 3. Set theme-color + backgrounds
    const color = resolveThemeColor(designTheme, mode);
    applySystemBarColor(color);

    // 4. Ensure viewport-fit=cover (needed for iOS safe-area)
    const vp = document.querySelector('meta[name="viewport"]');
    if (vp) {
      const c = vp.getAttribute("content") || "";
      if (!c.includes("viewport-fit=cover")) {
        vp.setAttribute("content", c + ", viewport-fit=cover");
      }
    }

    // 5. Apple web-app meta tags (only matter when added to home screen)
    const ensureMeta = (name: string, content: string) => {
      let m = document.querySelector(`meta[name="${name}"]`);
      if (!m) {
        m = document.createElement("meta");
        m.setAttribute("name", name);
        document.head.appendChild(m);
      }
      m.setAttribute("content", content);
    };
    ensureMeta("apple-mobile-web-app-capable", "yes");
    ensureMeta("apple-mobile-web-app-status-bar-style", "black-translucent");
  } catch {
    // Silently ignore – the useEffect hooks below are the real authority
  }
})();

function App() {
  const now = useTime();
  const [timezones, setTimezones, timezonesLoading, timezonePersistence] =
    usePersistentState<TimezoneConfig[]>("timezone_config", [], parseTimezoneConfig);
  const [settings, setSettings, settingsLoading, settingsPersistence] =
    usePersistentState<AppSettings>(
      "app_settings",
      DEFAULT_SETTINGS,
      parseAppSettings,
    );
  const [localSaveNoticeDismissed, setLocalSaveNoticeDismissed, , noticePersistence] =
    usePersistentState<boolean>(
      "local_save_notice_dismissed",
      false,
      parseNoticeDismissed,
    );

  const savingUnavailable = [timezonePersistence, settingsPersistence, noticePersistence].includes("unavailable");
  const designTheme = settings.designTheme || "te-1";

  const { capture } = useAnalytics();

  const handleSettingsChange = useCallback((next: AppSettings) => {
    setSettings(next);
    for (const event of settingsChanges(settings, next)) capture("settings_changed", event);
  }, [capture, settings, setSettings]);

  // Apply Theme (light/dark/system) - Class List Management
  useEffect(() => {
    const root = window.document.documentElement;
    const theme = settings.theme || "system";

    const applyTheme = (t: "light" | "dark" | "system") => {
      let isDarkMode = false;
      if (t === "dark") {
        isDarkMode = true;
      } else if (t === "light") {
        isDarkMode = false;
      } else if (t === "system") {
        isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
      }

      if (isDarkMode) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    applyTheme(theme);

    if (theme === "system") {
      const mediaQuery = window.matchMedia(
        "(prefers-color-scheme: dark)",
      );
      const handleChange = () => applyTheme("system");
      mediaQuery.addEventListener("change", handleChange);
      return () =>
        mediaQuery.removeEventListener("change", handleChange);
    }
  }, [settings.theme]);

  // Update theme-color meta tag (Safari/Mobile Support)
  useEffect(() => {
    const mode = settings.theme || "system";

    const updateTheme = () => {
      const color = resolveThemeColor(designTheme, mode);

      // Aggressively replace theme-color and set backgrounds
      applySystemBarColor(color);
    };
    
    updateTheme();

    if (mode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => updateTheme();
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [designTheme, settings.theme]);

  // Apply Design Theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute("data-design-theme", designTheme);
  }, [designTheme]);


  const [initialized, setInitialized] = useState(false);
  const [selection, setSelection] = useState<DateSelection>(LIVE_SELECTION);
  const [dateFeedback, setDateFeedback] = useState("");
  const [hoveredHourIndex, setHoveredHourIndex] = useState<
    number | null
  >(null);

  const homeTimezone =
    timezones.find((t) => t.isHome)?.timezone ||
    timezones[0]?.timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone;
  const selectedDate = selection.mode === "date" ? selection.date : null;
  const homeToday = getZonedFields(now, homeTimezone).date;
  const selectedStart = useMemo(() => selectedDate && isCalendarDate(selectedDate)
    ? startOfCalendarDate(selectedDate, homeTimezone) : null, [selectedDate, homeTimezone]);
  const unavailable = selectedDate !== null && selectedDate >= homeToday && selectedStart === null;
  const isLive = selectedDate === null || selectedDate < homeToday || selectedStart === null;
  const selectedDateOffset = isLive ? 0 : calendarDifference(selectedDate!, homeToday);
  const displayTime = isLive ? now : selectedStart!;
  const effectiveSelection = isLive ? LIVE_SELECTION : selection;
  const timezoneIds = useMemo(() => timezones.map((timezone) => timezone.timezone), [timezones]);

  useEffect(() => {
    if (selection.mode === "date" && isLive) {
      setSelection(LIVE_SELECTION);
      if (unavailable) setDateFeedback("This date does not exist in the home timezone. Choose another date.");
    }
  }, [selection, isLive, unavailable]);

  const handleSelectDate = useCallback((next: DateSelection) => {
    if (next.mode === "date" && startOfCalendarDate(next.date, homeTimezone) === null) {
      setDateFeedback("This date does not exist in the home timezone. Choose another date.");
      return;
    }
    setDateFeedback("");
    setSelection(next);
  }, [homeTimezone]);

  // Initialize default timezone if empty
  useEffect(() => {
    if (!timezonesLoading && !initialized) {
      if (timezones.length === 0) {
        try {
          const localZone =
            Intl.DateTimeFormat().resolvedOptions().timeZone;
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
    timezonesLoading,
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
      if (!timezones.find((tz) => tz.id === id)?.isHome) {
        const city = homeTz.city ? pickerCity(pickerResultId(homeTz.timezone, homeTz.city)) : undefined;
        capture("home_timezone_changed", { reference_timezone: homeTz.timezone,
          ...(city ? { reference_result_id: city.id } : {}) });
      }
    }
  }, [capture, setTimezones, timezones]);

  if (timezonesLoading || settingsLoading) {
    return (
      <>
        <div
          className="fixed inset-0 bg-[var(--dt-bg)]"
          style={{ zIndex: -1 }}
          aria-hidden="true"
        />
        <div className="min-h-dvh flex items-center justify-center bg-[var(--dt-bg)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--dt-accent)]"></div>
        </div>
      </>
    );
  }

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
              <Daybound className="h-8 text-[var(--dt-text)] transition-colors aspect-[347/68]" />
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
                  selection={effectiveSelection}
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
                        now={now}
                        timelineTime={displayTime}
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
            {/* Desktop Logo Footer */}
          <div className="hidden md:flex justify-center flex-grow items-end pt-6">
            <Daybound className="h-8 text-[var(--dt-text)] transition-colors opacity-50 hover:opacity-100 aspect-[347/68]" />
          </div>
        </main>
      </div>
    </MotionConfig>
  );
}

export default App;
