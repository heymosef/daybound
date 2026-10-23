# Scroll-aware edge fades

User requested fades at edges with more scrollable content, with the mobile
seven-day strip as the example. Implemented on the horizontal date strip and
vertical city-search results. The timeline remains unchanged because it is a
clipped comparison rail, not a scrollable viewport.

## Implementation

- Reusable useScrollFade measures only actual overflow and position. Passive
  scroll listeners update CSS properties directly, without React renders.
- ResizeObserver handles viewport/content/font sizing; MutationObserver handles
  replaced/shrinking result contents. All observers/listeners are cleaned up.
- Left/right/top/bottom fade lengths are zero at reached edges or when content
  fits. Values clamp rubber-band overscroll and handle physical RTL edges.
- CSS masks cover content inside existing frames, preserving background,
  border, shadow and corner treatment. Keyboard focus and forced-colors mode
  remove masks. No new animation, dependency, network request or analytics event.
- Search scroll padding keeps keyboard-highlighted options clear of fading
  edges. Existing input/option semantics and scrollIntoView behavior remain.
- The Today badge follows its first date button while scrolling and becomes
  hidden when that button leaves the visible strip; the calendar trigger stays
  outside the scrolling/masked area.

## Verification

Focused checks: 45 hook/date-picker/search tests PASS; typecheck/lint PASS.
Final candidate: 18 files / 344 tests PASS; both TypeScript checks PASS; ESLint
zero warnings; production build PASS. Six new geometry/lifecycle tests cover
horizontal and vertical boundaries, overscroll, resize, dynamic shrinking and
replaced content, RTL, and listener cleanup.

Actual browser checks used the production build served temporarily on loopback
50293, with collection disabled, plus the offline fixture for initial geometry:

- Mobile 391 × 822: date strip width277/content340. Start left0/right16px;
  at31.5px scroll both16px; end62.5px (rounded range63) left16px/right0.
- Today badge hidden after its button scrolls away. Native keyboard Tab traversal
  reaches the seventh date; focus-visible is true and its viewport mask is none.
- Long city query: 256px viewport/1746px content. Initial bottom fade only;
  mid-scroll both; end1490px top fade only. Twelve ArrowDown actions preserve
  active-option visibility with more than16px clearance from both edges.
- Replace query with Seattle: content/viewport64px, both vertical fades0.
- Resize to1280 × 720: all seven dates fit341px; both horizontal fades0.
- Temporary viewport override reset. No production-build console errors.

The existing offline fixture's restrictive CSP blocks the app's blob Paint
Worklet, making rounded frames invisible there. Its geometry checks remain
valid; visual/keyboard checks above used the actual production build so they
include the real corner and mask rendering. The fixture policy was not changed.

React/UI/accessibility review: existing tokens/density retained; native controls
and focus styles remain; no overlay intercepts pointer/touch input; masks avoid
adding screen-reader content; observers are lifecycle-scoped; scroll updates do
not trigger component renders or timeline conversions.

All changes remain local. Original main receives the verified commit by
fast-forward and its existing 127.0.0.1:4173 preview is rebuilt. No push, deploy,
external service changes or global runtime/model configuration changes.

Reference: https://ui.shadcn.com/docs/changelog/2026-06-chat-components
