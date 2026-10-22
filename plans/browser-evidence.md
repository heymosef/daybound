# Actual browser verification

Primary owns this layer through supported CUA browser tools. No external Playwright/CDP or browser-state mutation through evaluate. All product actions use actual controls. Status: PASS. Behavioral source initially80d6be4; final bounded layout correction446ca3a tested on rebuilt production output. No further source changes.

## Pre-008 baseline

Preserved plan006 production dist in ignored node_modules/.cache/daybound-before-008 and served it on127.0.0.1:4173. A fresh IAB tab rendered the real dashboard. Observed pageAssets resource inventory contained three Google Fonts CSS requests: Inter100..900, Geist Mono100..900, Pixelify Sans400..700, each display=swap. Console warn/error list was empty. The inventory exposed no font files; this establishes observed stylesheet request structure, not cold-network latency, successful font loading or LCP. Final008 candidate will receive the same resource observation.

## Integrated candidate behavior

Actual production output served on127.0.0.1:4175; offline real-App fixtures on4176. Browser tools used actual clicks, text entry, keyboard and read-only DOM snapshots/bounds. No browser-state mutation through evaluate. Fixture bootstrap supplies Date/storage/network scenarios before product imports; actual App controls drive state. Production desktop initially rendered at1280px; a separate production mobile tab confirmed390px client width. Temporary viewport overrides are reset after testing.

Production controls: added Kathmandu and London, changed Kathmandu to home, renamed it to a synthetic fixture label, reordered London above Vancouver, removed Vancouver, and reloaded. The remaining home label/order/settings persisted. Exercised12/24h, light/dark, and all three design themes; DOM data-design-theme explicitly changed to dos/gamut/te-1. No-config/loopback analytics control was disabled with truthful unavailable status. Production warn/error console list was empty.

Mobile390px: menu bounds124.25–380.25 fit viewport; calendar navigated toNovember2026 and selected15November; explicit Back to today returned live. City search/add/removeTokyo worked. Document scrollWidth equaled clientWidth390, with timeline clipping contained. Saved mobile settings/calendar screenshots. An initial viewport call affected another tab; final mobile assertions and screenshot use the independently confirmed390px production tab.

Final-font observation: one observed Google Fonts CSS2 resource contains all three families, original variable weight ranges and display=swap, compared with three pre008 resources. No font file inventory/timing was exposed, so no successful-load, cold-latency or LCP claim is made.

## Clock, selection and timezone scenarios

- At23:59:30Z UTC home, opened calendar and browsedApril2026. Keyboard Enter on the fixture Advance minute control crossed midnight to00:00:30Z while April15 remained visible. Mouse clicking an outside fixture control naturally closes the calendar; the keyboard path avoids that unrelated outside-click behavior.
- Chose15April, advanced a day, then changed home to Kolkata through actual row control: selected15April remained displayed. Explicit Today and reload start live.
- Chose8March at7March23:59, crossed midnight: indicator remained the preview dot and the first UTC rail cell remained8March00:00. After another day, it became past: indicator read Today and first cell changed to8March12:00 in the live centered rail. This proves equal-today preview and actual past-date fallback; absence of the far-date badge alone was not used as proof.
- Fractional fixture shows Kolkata02:30 UTC+05:30 and Kathmandu02:45 UTC+05:45 at2026-03-07T21:00Z.
- New York spring fixture has01:00 UTC−05 at06:00Z followed by03:00 UTC−04 at07:00Z, with the nonexistent02:00 absent. Fall fixture renders both01:00 occurrences at05:00Z/06:00Z with distinct offsets.
- Historical St Johns fixture exposes exact date dividers02:30Z,02:31Z and03:30Z on2009-11-01, including the brief midnight/backward crossing.

## Storage recovery

Malformed timezone/settings JSON recovered to a usable Vancouver dashboard and valid save notice. Blocked localStorage getter produced the visit-only failure notice; addingTokyo remained usable and visible after waiting for its entry animation. An immediate isVisible observation during animation was false; a semantic visible waiter subsequently confirmed the actual row. Quota mode preserved the read-valid initial state and only reported save failure after a rename attempted a write; the new label remained available for the visit. Analytics stayed off on blocked/quota modes, with the explicit preference-save failure status and zero requests. No storage bytes were accessed through browser evaluation.

## Intercepted analytics

Startup produced0 requests. Actual calendar/open/navigation/date/close/home/rename/search actions produced9 pending requests. Complete displayed envelopes omitted distinctive PRIVATE_BROWSER_LABEL_7291 and PRIVATE_BROWSER_SEARCH_7291 strings. Rename/home properties contained only profile/GeoIP disabling flags; failed search contained only length27/words1; date/navigation properties were bounded offsets/directions. Request credentials were omit and referrerPolicy no-referrer. No URL/referrer/private-label/query metadata appeared.

Actual Settings opt-out showed Off and changed9pending to0pending/9aborted. Another date action left count9 unchanged. Reload retained Off, produced0startuprequests and began live. A separate actual cross-tab fixture event changed1pending to0pending/1aborted and Settings toOff. All fetches were intercepted before real App imports, using a fake public token and .invalid host; CSP additionally forbids network connections. No real ingestion/CORS test or real analytics traffic occurred.

Fixture CSP intentionally blocks external fonts; fixture visual typography is not production-font evidence. Screenshot timing can include entry animations; production screenshots are the visual acceptance evidence.

## Browser-discovered correction

The1280px production screenshot revealed quarter-hour24h labels colliding under the desktop1.75em cell minimum. Plans/browser-layout-correction.md records the bounded shared-width correction, staff design approval, and required exact-delta review/DOM recheck. Exact source correction446ca3a removes the desktop narrowing override. After rebuilding and fresh navigation, actual1280px production DOM bounds showed shared cell widths58.5px and positive minimum adjacent-label gaps: TE-1=13.5546875px, DOS=19.5859375px, Gamut=16.546875px. Both rows retained25cells, the same first instant2026-10-22T07:00Z and first-left151.96405029296875px (alignment delta0).12h also had13.5546875px minimum gap. Final390px mobile check showed52px cells, alignment delta0 and scrollWidth=clientWidth390. The corrected desktop screenshot replaces the earlier collision capture. Staff approved the exact delta in final-staff-review.md.

Production desktop and mobile settings screenshots are saved in screenshots/desktop.jpg and screenshots/mobile-settings.jpg; mobile-calendar.jpg records the calendar interaction before the desktop-only width correction. Viewport overrides reset. Owned4173/4175/4176 servers stopped after verification; pre-existing4174 was untouched. Temporary browser tabs are not deliverables. No remote service or original-project source was changed.
