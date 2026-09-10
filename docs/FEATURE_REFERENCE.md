# Track Level Companion — Developer & Feature Reference

This document serves as the authoritative internal reference for the **Track Level Companion** codebase. It outlines all active UI components, data structures, calculation engines, and styling conventions.

---

## 1. UI Component Catalog

### 1.1 `StationConfig.tsx` (Top Navigation, Summary & Alignment)

Located in `src/components/StationConfig.tsx`.

#### Header Controls:
- **Project Name:** Editable inline text input bound to `project.name`.
- **Length Readout:** Static text displaying `{summary.lengthFt} ft Section`.
- **Guide Button:** Button with `<BookOpen />` icon, labeled `"Guide"`, opens `UserGuideModal`.
- **Files / Export Button:** Button with `<Sliders />` icon, labeled `"Files / Export"`, opens `DataManagementModal`.
- **Daylight Theme Toggle:** Button with `<Sun />` / `<Moon />` icon, toggles daylight high-contrast mode (`isDarkMode`).

#### 4-Card Field Summary Grid:
1. **Track Length:** Displays `{summary.lengthFt} ft` and `({summary.measuredCount}/{summary.totalStations})`.
2. **On Grade:** Displays `{onGradePercent}%` and `({summary.onGradeCount} pts)` within tolerance.
3. **Needs Lift (Low spots):** Colored **Sky Blue** (`text-sky-600 dark:text-sky-400`), displays `{summary.liftCount} pts` and optional `(Max +X")`.
4. **Needs Lower (High spots):** Colored **Amber** (`text-amber-600 dark:text-amber-400`), displays `{summary.lowerCount} pts` and optional `(Max -X")`.

#### Alignment Bar (Target Slope Controls):
- **Grade Mode Toggle Group:** Exactly two buttons:
  - **`[ Grade % ]` (`target_grade`):** Projects a slope line from Station 0.
  - **`[ End-to-End ]` (`end_to_end`):** Piecewise straight chords between the first station, any locked control points (LOCKED 🔒), and the last station.
- **Slope Controls (Visible when `Grade %` is active):**
  - Number input (`<input type="number" step="0.1">`) bound to `project.targetGradePercent`. User can type any custom percentage.
  - Quick Preset Buttons: **`0.0%`** (dead level benchmark), **`0.5%`**, **`1.0%`**, and **`1.5%`**.
- **Resulting Grade Readouts (Visible when `End-to-End` is active):**
  - Displays computed resulting grade: e.g. `Grade: +0.42% (+2.5" over 50ft)`.
  - When intermediate ties are locked (e.g. over a root), displays **`Net: X.XX%`** and individual chord segment slopes between locked ties (e.g. `0'-25': +0.67%`, `25'-50': -0.50%`).
- **Station Interval Dropdown:** Options for `1 ft (fine)`, `2 ft`, `5 ft (standard)`, `10 ft`.
- **Units Dropdown:** Options for `Ft, In & 1/16"`, `Inches & 1/16"`, `Decimal In`, `Metric (mm)`.

*(Note: There is no fraction resolution dropdown in `StationConfig.tsx`; the engine operates with 1/16" tolerance precision).*

---

### 1.2 `ProfileChart.tsx` (Vertical Profile Visualizer)

Located in `src/components/ProfileChart.tsx`.

#### Toolbar Controls:
- **Header Grade Readout Pill:** Reports overall section grade (e.g. `End-to-End: +0.25% (2 chords)` or `Grade: +1.00%`).
- **Evaluate Grade Tool Button (`<Ruler />`):**
  - Toggles the subset grade evaluation dropdown bar and range inspection mode.
  - Labeled `"Evaluate Grade"` on desktop, `"Grade"` on mobile.
  - When a range is locked, displays active span badge (e.g. `30'`).
- **Curve vs Straight Mode:**
  - **`Curve` (`<Spline />`):** Uses Fritsch-Carlson Monotone Cubic Spline (`getSmoothSplinePath()`). Guarantees smooth curvature passing through every point without overshoot or artificial waves.
  - **`Straight` (`<TrendingUp />`):** Draws straight point-to-point chords between adjacent stations.
- **Vertical Zoom Sensitivity (`Vert:`):**
  - **`1x` (True Scale):** Span multiplier `4.0`, min span `16.0"`, height `240px`. Flat, realistic perspective.
  - **`3x` (Gentle / Default):** Span multiplier `2.0`, min span `6.0"`, height `265px`. Standard track flex view.
  - **`8x` (Noticeable):** Span multiplier `1.33`, min span `1.75"`, height `300px`. Magnified dips and humps.
  - **`15x` (Exaggerated):** Extreme magnification for fine 1/16" micro-leveling.
- **Expand / Fit Width Toggle:**
  - **`Fit` (`<Minimize2 />`):** SVG fits container width (`850px` base).
  - **`Expand` (`<Maximize2 />`):** SVG width expands dynamically to enable horizontal scrolling for long tracks.

#### Subset Grade Evaluation Bar:
- Displays when `isMeasureModeActive` is true or two stations are selected:
  - **From / To Selectors:** Station dropdown pickers showing station foot and elevation.
  - **Live Metrics:**
    - `Span`: Horizontal distance in feet and station count.
    - `Rise/Fall`: Net vertical change ($Y_{\text{end}} - Y_{\text{start}}$).
    - `Grade`: Computed net slope percentage with directional glyph (`↗`, `↘`, `→`).
    - `Best-Fit`: Least-squares regression slope ($n \ge 3$).
  - **`Apply as Target` Action Button:** Invokes `onApplyTargetGrade(netGradePercent)` to immediately lock slope into the project's target grade.
  - **`Reset` / `Clear Range` Button:** Clears selected endpoints.

#### Mobile Touch Gestures & Hit Zones:
- **Full-Height Invisible Tap Columns:** `<rect>` elements covering the full vertical span of the chart for each station (`x - interval/2` to `x + interval/2`), providing easy, forgiving tap targets on touchscreens.
- **Touch Scrubbing (`handleTouchMove`):** Horizontal swipe / drag gestures detect movement ($|\Delta x| > 12\text{px}$) and scrub through stations with live chord preview; releasing locks the range.
- **Node Clicks:** First click sets start station, second click locks end station, clicking same station clears selection.

#### Active Station Banner:
- Persistent height (`min-h-[42px]`) prevents layout shifts when hovering or selecting ties.
- Displays station distance, laser reading, relative elevation, local design grade, leveling status badge (`LIFT`, `LOWER`, `ON GRADE`, `LOCKED`), and a prominent **`[✏️ Edit]`** button that directly opens `FractionKeypad`.

#### Visual Legend & Elements:
- **Green Dashed Line:** Target Grade Line.
- **On-Graph Grade Slope Badges:** Rendered directly along each chord segment of the green dashed target line (e.g. `+0.67% ↗`, `-0.50% ↘`, `0.00% Grade →`).
- **Solid White / Charcoal Line:** Rail Head Profile.
- **Sky Blue Dots:** Low spots requiring LIFT.
- **Amber Dots:** High spots requiring LOWER.
- **Green Dots:** On Grade ties.
- **Amber Ring / Lock Icon:** Locked Control Ties (LOCKED 🔒).
- **Purple Ring / Flag Icon:** Turning Point Benchmarks (TP).

---

### 1.3 `ActionTable.tsx` (Trackside Leveling Checklist)

Located in `src/components/ActionTable.tsx`.

#### Header Toolbar:
- **Display Mode Toggle:** Segmented control (`[ Target Rod ]`, `[ Relative Elev ]`, `[ Both ]`) bound to `TableDisplayMode`. Automatically persists preference in `localStorage.getItem('tlc_table_display_mode')`.
  - Also toggled by clicking the desktop table column header (`Target Rod` / `Relative Elev`).
- **`Move Laser (Datum)`:** Purple button with `<Flag />` icon. Opens the Laser Relocation modal pre-selected to the last measured station.
- **`+ Extend`:** Button with `<Layers />` icon. Opens the batch Extend Track modal.
- **`+ Custom Pt`:** Prompts for custom distance along track (e.g. `12.5 ft`) and inserts in sorted order.
- **`Add Next`:** Amber button with `<Plus />` icon. Appends one station at `lastDist + interval` and opens the keypad.

#### Active Laser Relocation Banner:
- Appears when `stations.some(s => s.isTurningPoint)`.
- Reports active turning point benchmarks.
- Contains a **`Revert Laser Move`** button to undo relocation and restore original readings.

#### Extend Track Modal:
- **Length Presets:** `+25'`, `+50'`, `+100'`, `+200'`.
- **Interval Presets:** `1'`, `2'`, `5'`, `10'`.
- **Direction Toggle:**
  - **`Ahead (Forward →)`:** Extends track after the last station.
  - **`Behind 0 (Backward ←)`:** Inserts negative stations (`-5'`, `-10'`, `-15'`) before Station 0 for taper runout feathering.

#### Row Actions & Layouts:
- **Mobile Card View (`md:hidden`):** Zero horizontal scroll. Large touch-friendly cards showing distance, `LOCKED` & `TP` badges, dynamic middle row switching between `Target Rod`, `Relative Elev`, or both stacked, full-width status pill, and action icons (Lock, TP, Edit, Delete).
- **Desktop Table View (`hidden md:block`):** 6-column tabular layout (Status checkbox, Station, Laser Reading, Dynamic Target/Elevation column, Track Action pill, Actions).
- **Status Pills:**
  - **`ON GRADE ✓`:** Emerald Green (`bg-emerald-500/20 text-emerald-600 dark:text-emerald-400`).
  - **`LIFT +X"`:** Sky Blue (`bg-sky-500/20 text-sky-600 dark:text-sky-400`).
  - **`LOWER -X"`:** Amber (`bg-amber-500/20 text-amber-600 dark:text-amber-400`).
  - **`LOCKED`:** Amber with `<Lock />` icon (`bg-amber-500/20 text-amber-600 dark:text-amber-400`).

---

### 1.4 `FractionKeypad.tsx` (Adaptive Input Keypad)

Located in `src/components/FractionKeypad.tsx`.

#### Live Target Badge:
Prominently placed above input buttons: displays the calculated target rod reading and required action for the tie, e.g. `🎯 Target: 1' 2 3/8" (Aim: Lift +1/4")`.

#### Adaptive Layouts Based on `unitFormat`:
1. **`decimal_inches` Mode (Default):**
   - Touch numeric keypad (`0–9`, `.`, `+/-`, Backspace, Clear).
   - Instant decimal steppers: `+1.0"`, `-1.0"`, `+0.1"`, `-0.1"`.
   - Optimized for modern digital and decimal laser rods (e.g. `6.28"`, `5.86"`).
2. **`feet_inches_fraction` Mode:**
   - **Feet Column:** `0'`, `1'`, `2'`, `3'`, `4'`, `5'`.
   - **Inches Grid:** `0"` through `11"`.
   - **Fraction Grid:** `0 (even)`, `1/16` through `15/16` (filtered to 8ths if `fractionResolution === 8`).
3. **`inches_fraction` Mode (Total Inches):**
   - Direct whole inches selector (`0"` through `48"+`) + 16th fraction grid (no feet column).
4. **`metric_mm` Mode:**
   - Touch numeric keypad for millimeters (`0–9`, `+/-`, Backspace, Clear).
   - Millimeter steppers: `+10mm`, `-10mm`, `+1mm`, `-1mm`.
   - Real-time conversion preview displaying current value in inches (`= X.XX"`).

#### Action Buttons & Advance Feedback:
- **`Next Station` (`<ArrowRight />`):** Primary button. Saves current value, triggers visual glow feedback, and automatically opens the next station down the line.
- **`Save` (`<Check />`):** Emerald button. Saves current value and closes keypad.
- **`Save & Prev` (`<ArrowLeft />`):** Saves current value and opens previous station.
- **Close (`<X />`):** Discards unsaved changes and closes modal.

---

### 1.5 `DataManagementModal.tsx` (Files, Templates, CSV & Saved Tracks)

Located in `src/components/DataManagementModal.tsx`.

#### Tabs & Features:
1. **`Export CSV`:**
   - **Download .CSV File:** Downloads `{name}_{date}.csv` or triggers mobile native share sheet (`navigator.share`).
   - **Copy CSV to Clipboard:** Copies RFC-compliant CSV text with confirmation toast.
   - **View / Copy Raw CSV Text:** Expandable textarea with "Copy All" button.
2. **`Import CSV`:**
   - **Field Data Template (Excel / Google Drive):**
     - **`Download Template (.CSV)`:** Downloads a clean `track_template.csv` pre-populated with station chains.
     - **`Copy for Google Sheets (Clipboard)`:** Copies TSV text for 1-click paste into Google Sheets.
     - 4-step field workflow guidance.
   - **Upload CSV File from Device:** File picker for `.csv` or `.txt`.
   - **Paste CSV / Spreadsheet Text:** Textarea for Excel or Google Sheets columns (accepts comma, tab, or semicolon delimiters).
   - **Resolution Card:** Previews stations found and presents **`[ Load & Replace Track ]`** and **`[ Cancel ]`**.
   - *(Note: `ENABLE_MERGE_FEATURE = false` hides merge prompts for single-operator clarity; see `docs/MERGE_FEATURE.md`).*
3. **`Saved Tracks`:**
   - **Save Active Track:** Stores profile in browser `localStorage`.
   - **Saved List:** Each card has **Load**, **Download CSV**, and **Delete**.
   - **Presets:** `"Load Demo 50ft Track (with Dip)"` and `"Reset Track"`.

---

## 2. Core Calculations & Mathematical Rules

Located in `src/core/calculations.ts`.

### 2.1 Optical Rod Geometry ("The Rod Rule")
The rotary laser establishes a level reference plane. The rod measures distance **DOWN** from that plane to the rail head:
$$\text{Elevation} = \text{Datum Reference} - \text{Effective Reading}$$

- **Track Sags (Dip):** Rod sinks $\to$ reading increases (BIGGER number) $\to$ $\text{Elevation} < 0$ $\to$ **LIFT** (Sky Blue).
- **Track Humps (High):** Rod rises $\to$ reading decreases (SMALLER number) $\to$ $\text{Elevation} > 0$ $\to$ **LOWER** (Amber).

### 2.2 Unified Active Laser Scale (Turning Point Relocation)
When the laser tripod is relocated at turning point tie $T$ by shift $\Delta = \text{newReading} - \text{oldReading}$:
1. All previously measured stations (Station 0 through $T$) are converted into Laser 2's scale:
   $$\text{readingInches} \leftarrow \text{readingInches} + \Delta$$
   $$\text{datumOffsetInches} \leftarrow \text{datumOffsetInches} + \Delta$$
2. Because Station 0 shifts by $+\Delta$, the datum reference becomes $\text{datum}_0 + \Delta$.
3. For any prior station $i$:
   $$\text{Elevation}_i = (\text{datum}_0 + \Delta) - (\text{reading}_i + \Delta) = \text{datum}_0 - \text{reading}_i$$
4. **Physical Invariance:** $\Delta$ cancels out completely. Elevations, slope lines, and required lifts/lowers remain identical to 0.0001", while every number on the screen matches the active laser on the rod receiver.

### 2.3 Target Slope Modes
1. **`target_grade` Mode:**
   - Anchored at Station 0 with elevation $Y_0$ at distance $X_0$.
   - Pitch rate: $\text{slopeInchesPerFt} = (\text{targetGradePercent} / 100) \times 12$.
   - Target line: $\text{Target}_i = Y_0 + (X_i - X_0) \times \text{slopeInchesPerFt}$.
2. **`end_to_end` Mode (with Locked Control Points):**
   - Identifies control points: First valid station, any station with `isLocked: true` (ROOT), and the last valid station.
   - Calculates piecewise linear chords between adjacent control points $(X_A, Y_A)$ and $(X_B, Y_B)$.
   - A locked station forces $\text{Target} = \text{Elevation}$, $\text{Lift} = 0$, and status `'LOCKED 🔒'`.

### 2.4 Target Rod Reading Formula
To display the exact physical laser rod measurement required to bring a tie on grade:
$$R_{\text{target}} = R_{\text{current}} - \text{Lift}$$
Or when a station has not yet been surveyed:
$$R_{\text{target}} = (D - E_{\text{target}}) + O_{\text{active}}$$
Where:
- $D$ is the base datum reading at Station 0.
- $E_{\text{target}}$ is the calculated design elevation at that station.
- $O_{\text{active}}$ is the cumulative active laser offset for that section.

### 2.5 Subset Grade Evaluation Algorithm (`calculateSubsetGrade`)
Calculates the geometric chord slope and linear regression between any two surveyed stations $A$ and $B$:
1. **Span & Elevation Rise/Fall:**
   $$\Delta X = X_B - X_A \quad (\text{ft})$$
   $$\Delta Y = Y_B - Y_A \quad (\text{inches})$$
2. **Direct Chord Grade Percentage:**
   $$\text{Grade}_{\text{chord}}\% = \left( \frac{\Delta Y}{\Delta X \times 12} \right) \times 100$$
3. **Best-Fit Linear Regression (when $n \ge 3$ measured ties exist in range):**
   $$m = \frac{n \sum (X_i Y_i) - \left(\sum X_i\right) \left(\sum Y_i\right)}{n \sum X_i^2 - \left(\sum X_i\right)^2} \quad (\text{in/ft})$$
   $$\text{Grade}_{\text{best-fit}}\% = \left( \frac{m}{12} \right) \times 100$$
4. **Max Deviation from Straight Chord:**
   $$d_{\max} = \max_{i} | Y_i - (Y_A + (X_i - X_A) \times (\Delta Y / \Delta X)) |$$

---

## 3. UI Color System

| Purpose | Tailwind Classes | Hex / Visual |
| :--- | :--- | :--- |
| **Needs Lift (Low Spot)** | `text-sky-600 dark:text-sky-400 bg-sky-500/20` | `#38bdf8` (Sky Blue) |
| **Needs Lower (High Spot)** | `text-amber-600 dark:text-amber-400 bg-amber-500/20` | `#f59e0b` (Amber) |
| **On Grade (Within Tol)** | `text-emerald-600 dark:text-emerald-400 bg-emerald-500/20` | `#10b981` (Emerald Green) |
| **Locked Tie / ROOT** | `text-amber-600 dark:text-amber-400 bg-amber-500/20 border-amber-500/30` | Amber with Lock icon |
| **Laser Relocation / TP** | `text-purple-600 dark:text-purple-300 bg-purple-500/20 border-purple-500/30` | Purple with Flag icon |

---

## 4. Offline Progressive Web App (PWA) Architecture

Configured via `vite-plugin-pwa` in `vite.config.ts`:
- **Service Worker Engine:** Workbox precaching all HTML, JS, CSS, and webmanifest bundles.
- **Auto-Update Registration:** `registerType: 'autoUpdate'`, with client bundle auto-inject.
- **Single Page Navigation Fallback:** Configured `/track-level-companion/index.html` as navigation fallback for GitHub Pages base URL routing.
- **Device Connectivity Detection:** Native `navigator.onLine` and `online`/`offline` window events drive the live connectivity status pill in `StationConfig.tsx`.
- **Zero Cache Deletion on Reload:** Cleaned out all legacy destructive cache-purging scripts in `index.html`.

