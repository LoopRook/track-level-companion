# Track Level Companion — Developer & AI Agent Guide (CLAUDE.md)

Welcome to **Track Level Companion**! This document provides everything an AI agent (Claude Code, Antigravity, or human engineer) needs to know to understand, navigate, maintain, and enhance this codebase efficiently.

---

## 1. Project Overview & Identity

- **Application Name**: Track Level Companion
- **Current Version**: `v0.17.2 Beta` (managed in `src/core/version.ts` & `package.json`)
- **Target Audience**: Track maintenance crews, trackmasters, and volunteers maintaining miniature railways, park trains, narrow-gauge railroads, and industrial sidings.
- **Form Factor**: Offline-first Progressive Web App (PWA). Highly optimized for trackside smartphones (Google Pixel 7, OnePlus, Samsung Galaxy, iPhone SE), rugged field tablets (iPad 768px/1024px), and field laptops/desktops.
- **Tech Stack**: React 19, TypeScript 5.7, Vite 6, Tailwind CSS 4, Lucide React icons, Vitest, Workbox / Vite-Plugin-PWA.
- **Design Philosophy**: **Nothing OS** technical instrument aesthetic.
  - Typography: Space Grotesk (UI body), Space Mono (data, readouts, brackets, labels), Doto (hero metrics).
  - High contrast: OLED deep black (`#000000`) in Nocturnal Dark Mode; warm off-white paper (`#F5F5F5` / `#FFFFFF`) in Daylight Sun Light Mode. SBB vermilion red accents (`#D71921`).
  - Tactile hardware keys: Subtle 8–12px fillets (`rounded-xl`), sharp 1px borders, uppercase bracketed identifiers (`[ ACTION ]`). **Strictly zero rounded-full "bubble wrap" pills**.

---

## 2. Track Engineering Domain & Mathematics

Field surveying using a rotating laser transmitter has specific geometric properties:

1. **Inverted Measurement Scale**:
   - The rotating laser transmitter creates a true horizontal (or tilted) plane above the rails.
   - The surveyor places a grade rod with a detector on the rail head and measures **downward** from the laser plane.
   - **Smaller rod reading = physically higher rail!**
   - Relative Elevation: `elevation = datumRodReading - currentRodReading`.
2. **Track Correction (Lift / Lower)**:
   - `liftInches = targetElevationInches - currentElevationInches`.
   - **Positive Lift (`▲ LIFT`)**: Rail is too low; crew must jack/tamp ballast or add track shims under the tie plate.
   - **Negative Lift (`▼ LOWER`)**: Rail is too high; crew must tamp down ballast or remove shims.
   - **On Grade (`✓ ON GRADE`)**: Elevation is within the project tolerance window (default `±1/16"` or `±0.05"`).
3. **Target Rod Reading**:
   - `targetReadingInches = readingInches - liftInches`.
   - The exact number the detector will read when the rail is brought to true target grade. Crews use this number to set their detector clamp on the rod.
4. **Grade Modes**:
   - `end_to_end`: Connects the first station to the last station. If intermediate stations are locked (`isLocked: true`, e.g. at a road crossing or bridge), it calculates separate grade slopes between each locked anchor point.
   - `target_grade`: A fixed uniform percentage slope (e.g. `0.00%` flat, `+0.50%` incline, `-0.25%` decline) radiating from Station 0.
5. **Laser Relocation / Turning Points (`TP`)**:
   - When the laser transmitter is moved down the track, a common station tie serves as a Turning Point benchmark.
   - Old Laser reading vs New Laser reading calculates the instrument height shift: `delta = tpNewReading - tpOldReading`.
   - All readings are normalized to the active laser scale so the crew never loses their datum elevation reference.

---

## 3. Directory Structure & File Roadmap

```
Track Level Companion/
├── CLAUDE.md                         # This comprehensive agent guide
├── package.json                      # Project metadata, version, dependencies, scripts
├── vite.config.ts                    # Vite build configuration + PWA manifest & service worker
├── tsconfig.json                     # TypeScript strict type configuration
├── index.html                        # Application HTML shell with font preloads
├── src/
│   ├── main.tsx                      # React root entrypoint
│   ├── index.css                     # Tailwind 4 setup, Nothing OS themes, @media print rules
│   ├── App.tsx                       # Root orchestrator: state, modals, active tabs, PWA update
│   │
│   ├── core/                         # Pure, headless TypeScript business logic
│   │   ├── calculations.ts           # Pure math: profiles, grade splines, lift/cut, target rods
│   │   ├── calculations.test.ts      # Unit tests for calculations & edge cases
│   │   ├── calculations_stress.test.ts # Stress tests (1000+ stations, extreme grades)
│   │   ├── units.ts                  # Parsing & formatting (1/16", 1/8", decimal, mm)
│   │   ├── units.test.ts             # Precision formatting tests
│   │   ├── types.ts                  # Core TypeScript types (StationPoint, TrackProject, etc.)
│   │   ├── csv.ts                    # CSV import & export engine with auto-detection
│   │   ├── csv.test.ts               # Unit tests for CSV handling
│   │   ├── csv_stress.test.ts        # Malformed CSV & high-volume stress tests
│   │   ├── haptics.ts                # Web Vibration API haptic feedback patterns
│   │   ├── haptics.test.ts           # Tests for vibration support & fallbacks
│   │   ├── sharing.ts                # URL compressed project sharing & QR generation
│   │   ├── sharing.test.ts           # Tests for project serialization
│   │   ├── version.ts                # Single source of truth for versioning (APP_VERSION)
│   │   └── useBodyScrollLock.ts      # Custom hook to prevent background scrolling on mobile
│   │
│   └── components/                   # UI Components
│       ├── ActionTable.tsx           # Field checklist table, station cards, quick toolbar
│       ├── CustomPointModal.tsx      # Modal to add intermediate custom chainage stations
│       ├── DataManagementModal.tsx   # Project files, CSV export/import, print trigger, QR share
│       ├── FirstTimeWelcomeModal.tsx # Onboarding setup wizard launched on first use
│       ├── FractionKeypad.tsx        # High-tactile field software keypad (prevents mobile keyboard)
│       ├── IncomingShareModal.tsx    # Modal confirming imported project from URL share
│       ├── InteractiveTutorial.tsx   # Guided step-by-step interactive field simulation
│       ├── MobileSimulator.tsx       # Desktop tool to simulate handheld phone frames
│       ├── MobileToolsModal.tsx      # Mobile unified drawer for tools, settings, and navigation
│       ├── NewTrackModal.tsx         # Wizard to start blank track, 50ft/100ft grid, or reset readings
│       ├── PrintReport.tsx           # Dedicated 8.5x11 / 11x17 landscape printable field sheet
│       ├── ProfileChart.tsx          # Interactive SVG track vertical profile elevation graph
│       ├── PrototypeLab.tsx          # Design system comparison lab (Nothing OS, Swiss, Glass)
│       ├── QRCodeModal.tsx           # Displays offline QR code for instant project sharing
│       ├── SettingsModal.tsx         # Tolerance window, unit formats, theme, developer options
│       ├── StationConfig.tsx         # Header telemetry HUD, StationSummaryBar, StationAlignmentBar
│       ├── TutorialsModal.tsx        # Catalog of 4 interactive field tutorials
│       ├── UpdatePrompt.tsx          # PWA service worker update toast & manual check
│       └── UserGuideModal.tsx        # Comprehensive field manual and track geometry guide
```

---

## 4. Key Architectural Patterns & Invariants

When modifying or adding code, you **MUST** uphold these core invariants:

### A. Anti-Wrapping Brackets Rule
- Any button or label formatted with Nothing OS brackets (e.g. `[ CLOSE ]`, `[ TOOLS ]`, `[ ON GRADE ]`) **must never break brackets across lines**.
- Always apply: `whitespace-nowrap shrink-0 inline-flex items-center justify-center select-none`.
- On compact mobile screens (`<640px`), use responsive text (e.g. `[ TOOLS ]` on mobile, `[ FIELD TOOLS & SETTINGS ]` on desktop) with `truncate min-w-0 flex-1` on adjacent text.

### B. Mobile Profile Tab Zero-Scroll Rule
- On handheld mobile portrait screens (e.g. Google Pixel 7 `412x718`, compact phones `360x740`), the **Profile tab must NOT scroll vertically** (`hasScroll: false`).
- Layout budget:
  - Top HUD Header: ~48px
  - Profile Chart: fixed at `chartHeight = 230px` on mobile (preserves dot-matrix clarity and touch hit targets).
  - Compact StationSummaryBar: ~62px
  - Mobile StationAlignmentBar: collapses by default to a sleek 34px accordion (`[ GRADE: END-TO-END ▼ ]`), expandable on tap.
  - Bottom Thumb Dock: ~64px
  - Total: ~550px < 718px usable height. Never increase mobile chart height above 240px.

### C. Printable PDF Field Sheet Ink-Saver Standard
- In `src/components/PrintReport.tsx` and `@media print` in `src/index.css`:
  - **100% White Background**: No black/dark fills on paper.
  - **Toner-Saving Monochrome**: Table headers, badges (`ON GRADE`, `LIFT`), target dashed line, and station nodes use transparent/white backgrounds with crisp black borders and black text.
  - **Nothing OS Dot Matrix Filler Grid**: Any empty page space or the dedicated `[ FIELD NOTES & SKETCH GRID ]` box displays the subtle 16px grey dot matrix grid on pure white paper (`background-image: radial-gradient(circle, #a1a1aa 1.1px, transparent 1.1px)`), giving surveyors an authentic engineering graph-paper surface.

### D. Semantic Versioning & PWA Updates
- When releasing fixes or features, always update `APP_VERSION` in:
  1. `package.json`
  2. `src/core/version.ts`
  3. `src/components/UpdatePrompt.test.tsx`
- The app includes a service worker update detection system with a manual "Check for Updates" trigger in Settings.

---

## 5. Development & Testing Commands

All commands run with PowerShell or bash from the project root:

```bash
# Start local development server (accessible via localhost and local LAN)
npm run dev

# Run full automated test suite (Vitest)
npm test -- --run

# Run TypeScript compilation & production build
npm run build

# Start a Cloudflare quick tunnel for remote phone testing
npx cloudflared tunnel --url http://localhost:5173

# Deploy to GitHub Pages (automated via git push origin main)
git push origin main
```

---

## 6. Recent Changelog & Completed Milestones

- **v0.17.2 Beta**:
  - Restored large, comfortable thumb-reach `[ CLOSE TOOLS MENU ]` button in mobile tools drawer footer.
  - Formatted printable PDF field sheet with Nothing OS dot-matrix engineering filler grid on pure white paper.
  - Added dedicated `[ FIELD NOTES, TURNOUT OBSTRUCTIONS & SKETCH GRID ]` bounded box on printouts.
  - Prepared `CLAUDE.md` comprehensive developer and agent onboarding documentation.
- **v0.17.1 Beta**:
  - Fixed mobile tools menu bracket wrapping and duplicate close button.
  - Made printable PDF field sheet 100% monochrome ink-saver.
- **v0.17.0 Beta**:
  - Implemented First-Time Setup & Onboarding Guide modal (`FirstTimeWelcomeModal.tsx`).
  - Solved mobile Profile tab vertical scrolling on Pixel 7 and OnePlus devices.
  - Multi-device breakpoint polish across 9 device viewports (360px up to 1920px).
- **v0.16.x Beta**:
  - High-precision fraction keypad with mobile viewport auto-fit.
  - Re-triggerable PWA update engine and manual update check.
  - Multi-step interactive field simulation tutorials (Laser Relocation, Grade Locking).

---

## 7. Useful Agent Tips

- **Testing Modals on Mobile**: When using Playwright or Puppeteer to test mobile views, dismiss the first-time welcome modal by executing:
  ```js
  localStorage.setItem('has_seen_welcome_guide', 'true');
  localStorage.setItem('tlc_beta_notice_dismissed', 'true');
  localStorage.setItem('tlc_onboarding_dismissed', 'true');
  ```
- **Device Simulator**: You can test mobile layouts on desktop without DevTools by clicking `[ SIMULATOR ]` in the footer or settings, which renders a live interactive phone bezel with device selection (Pixel 7, iPhone SE, OnePlus, etc.).
