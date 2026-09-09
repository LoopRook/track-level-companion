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
  - **`[ End-to-End ]` (`end_to_end`):** Piecewise straight chords between the first station, any locked control points (ROOT), and the last station.
- **Slope Controls (Visible when `Grade %` is active):**
  - Number input (`<input type="number" step="0.1">`) bound to `project.targetGradePercent`.
  - Quick Preset Buttons: **`0.0%`** (dead level benchmark), **`0.5%`**, and **`1.0%`**.
- **Station Interval Dropdown:** Options for `1 ft (fine)`, `2 ft`, `5 ft (standard)`, `10 ft`.
- **Units Dropdown:** Options for `Ft, In & 1/16"`, `Inches & 1/16"`, `Decimal In`, `Metric (mm)`.

*(Note: There is no fraction resolution dropdown in `StationConfig.tsx`; the engine operates with 1/16" tolerance precision).*

---

### 1.2 `ProfileChart.tsx` (Vertical Profile Visualizer)

Located in `src/components/ProfileChart.tsx`.

#### Toolbar Controls:
- **Curve vs Straight Mode:**
  - **`Curve` (`<Spline />`):** Uses Fritsch-Carlson Monotone Cubic Spline (`getSmoothSplinePath()`). Guarantees smooth curvature passing through every point without overshoot or artificial waves.
  - **`Straight` (`<TrendingUp />`):** Draws straight point-to-point chords between adjacent stations.
- **Vertical Zoom Sensitivity (`Vert:`):**
  - **`1x` (True Scale):** Span multiplier `4.0`, min span `16.0"`, height `240px`. Flat, realistic perspective.
  - **`3x` (Gentle / Default):** Span multiplier `2.0`, min span `6.0"`, height `265px`. Standard track flex view.
  - **`8x` (Noticeable):** Span multiplier `1.33`, min span `1.75"`, height `300px`. Magnified dips and humps.
  - **`15x` (Exaggerated):** Span multiplier `1.08`, min span `0.5"`, height `340px`. High-magnification micro-leveling.
- **Expand / Fit Width Toggle:**
  - **`Fit` (`<Minimize2 />`):** SVG fits container width (`850px` base).
  - **`Expand` (`<Maximize2 />`):** SVG width expands dynamically to enable horizontal scrolling for long tracks.

#### Active Station Banner:
- Appears when a station is clicked or hovered: displays distance, reading, elevation, status badge, and an **`Edit`** button that directly opens the `FractionKeypad`.

#### Visual Legend & Elements:
- **Green Dashed Line:** Target Grade Line.
- **Solid White / Charcoal Line:** Rail Head Profile.
- **Sky Blue Dots:** Low spots requiring LIFT.
- **Amber Dots:** High spots requiring LOWER.
- **Green Dots:** On Grade ties.
- **Amber Ring / Lock Icon:** Locked Control Ties (ROOT).
- **Purple Ring / Flag Icon:** Turning Point Benchmarks (TP).

---

### 1.3 `ActionTable.tsx` (Trackside Leveling Checklist)

Located in `src/components/ActionTable.tsx`.

#### Header Toolbar:
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
- **Mobile Card View (`md:hidden`):** Zero horizontal scroll. Large touch-friendly cards showing distance, `ROOT` & `TP` badges, laser reading, relative elevation, full-width status pill, and action icons (Lock, TP, Edit, Delete).
- **Desktop Table View (`hidden md:block`):** 6-column tabular layout (Status checkbox, Station, Laser Reading, Relative Elev, Track Action pill, Actions).
- **Status Pills:**
  - **`ON GRADE ✓`:** Emerald Green (`bg-emerald-500/20 text-emerald-600 dark:text-emerald-400`).
  - **`LIFT +X"`:** Sky Blue (`bg-sky-500/20 text-sky-600 dark:text-sky-400`).
  - **`LOWER -X"`:** Amber (`bg-amber-500/20 text-amber-600 dark:text-amber-400`).
  - **`LOCKED (ROOT)`:** Amber with `<Lock />` icon (`bg-amber-500/20 text-amber-600 dark:text-amber-400`).

---

### 1.4 `FractionKeypad.tsx` (Measurement Input Keypad)

Located in `src/components/FractionKeypad.tsx`.

#### Modes:
1. **Touch Keypad Mode (Default):**
   - **Feet Selector:** `0'`, `1'`, `2'`, `3'`, `4'`, `5'`.
   - **Inches Selector:** `0"` through `11"`.
   - **Fraction Selector (4x4 grid):** `0 (even)`, `1/16` through `15/16`.
2. **Direct Keyboard Input Mode:**
   - Single input field accepting feet/inches (`1' 4 3/8"`), inches (`16 3/8"`), hyphens (`1-4-3/8`), or decimals (`14.5`).

#### Nudge Toolbar:
- Buttons: `-1/4"`, `-1/16"`, `+1/16"`, `+1/4"`.

#### Action Buttons:
- **`Next Station` (`<ArrowRight />`):** Black/white primary button. Saves current value and automatically opens the next station down the line.
- **`Save` (`<Check />`):** Emerald button. Saves current value and closes keypad.
- **`Save & Prev` (`<ArrowLeft />`):** Saves current value and opens previous station.
- **Close (`<X />`):** Discards unsaved changes and closes modal.

---

### 1.5 `DataManagementModal.tsx` (Files, CSV & Saved Tracks)

Located in `src/components/DataManagementModal.tsx`.

#### Tabs:
1. **`Export CSV`:**
   - **Download .CSV File:** Downloads `{name}_{date}.csv` or triggers mobile native share sheet (`navigator.share`).
   - **Copy CSV to Clipboard:** Copies RFC-compliant CSV text with green confirmation toast.
   - **View / Copy Raw CSV Text:** Expandable textarea with "Copy All" button.
2. **`Import CSV`:**
   - **Upload CSV File from Device:** File picker for `.csv` or `.txt`.
   - **Paste CSV / Spreadsheet Text:** Textarea for Excel or Google Sheets columns.
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

---

## 3. UI Color System

| Purpose | Tailwind Classes | Hex / Visual |
| :--- | :--- | :--- |
| **Needs Lift (Low Spot)** | `text-sky-600 dark:text-sky-400 bg-sky-500/20` | `#38bdf8` (Sky Blue) |
| **Needs Lower (High Spot)** | `text-amber-600 dark:text-amber-400 bg-amber-500/20` | `#f59e0b` (Amber) |
| **On Grade (Within Tol)** | `text-emerald-600 dark:text-emerald-400 bg-emerald-500/20` | `#10b981` (Emerald Green) |
| **Locked Tie / ROOT** | `text-amber-600 dark:text-amber-400 bg-amber-500/20 border-amber-500/30` | Amber with Lock icon |
| **Laser Relocation / TP** | `text-purple-600 dark:text-purple-300 bg-purple-500/20 border-purple-500/30` | Purple with Flag icon |
