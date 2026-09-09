# Track Level Companion — Field Guide & User Manual

A practical, field-ready handbook for track maintenance crews, surveyors, and mini-railroad / standard gauge operators using **Track Level Companion**.

---

## 1. The Core Laser Principle ("The Rod Rule")

When surveying track with a rotary laser, the laser emits a **perfectly flat plane of light** across the work area. The grade rod rests on top of the rail head.

$$\text{Elevation} = \text{Datum Reference Reading} - \text{Laser Reading}$$

### The Rule to Remember:
```
┌────────────────────────────────────────────────────────────────────────┐
│  BIG NUMBER ON ROD   ──>  Track is DIPPING in dirt  ──>  APP: LIFT     │
│                           (Sky Blue Badge ▲)                           │
│                                                                        │
│  SMALL NUMBER ON ROD ──>  Track has a HUMP / HIGH   ──>  APP: LOWER    │
│                           (Amber Badge ▼)                              │
└────────────────────────────────────────────────────────────────────────┘
```

- **When track sags:** The rail drops $\to$ the rod drops $\to$ the laser hits higher up on the measurement face (e.g. `1' 4 1/2"` instead of `1' 2"`). The app tells you: **`LIFT 2 1/2"`** (Sky Blue).
- **When track humps:** The rail rises $\to$ the rod is pushed up $\to$ the laser hits lower down on the rod (e.g. `1' 0 1/2"`). The app tells you: **`LOWER 1 1/2"`** (Amber).

The app handles all inversions automatically, eliminating mental math errors in the field.

---

## 2. Standard 5-Step Field Workflow

### Step 1: Establish Station 0 (Benchmark)
1. Pick your starting reference point (e.g. an existing crossing, switch heel, or undisturbed joint).
2. Mark it **Station 0** in chalk on the tie.
3. Place your grade rod on Station 0 and enter the reading (e.g. `1' 2"`). This sets your baseline datum elevation ($0.00"$).

### Step 2: Walk the Ties & Record Readings
1. Walk down the track at your chosen interval (e.g. Station 5, 10, 15, 20...).
2. Tap each station row or card to open the **Rapid Fraction Keypad**.
3. Tap the feet, inches, and fractions (e.g. `1'`, `4"`, `3/8"`), or switch to direct keyboard mode.
4. Tap **`Next Station`** (`→`) — the app saves the reading and automatically opens the next tie down the line.

### Step 3: Inspect the Vertical Profile Chart
- Glance at the **Track Vertical Profile** chart:
  - **Dips** sag below the dashed green target line.
  - **Humps** peak above the dashed green target line.
  - Switch between **Curve** (smooth flex spline) and **Straight** (chords).
  - Adjust vertical zoom (`1x` true scale up to `15x` micro-precision).

### Step 4: Jacking & Tamping (Checklist Actions)
1. Check the **Track Action** column/banner on your checklist:
   - **`ON GRADE ✓`** (Emerald Green): Within tolerance (1/16"). Do not touch.
   - **`LIFT 3/8"`** (Sky Blue): Jack tie up by 3/8" and tamp ballast underneath.
   - **`LOWER 1/4"`** (Amber): Rail is high. Knock down ballast or avoid lifting adjacent ties.
   - **`LOCKED (ROOT)`** (Amber with Lock): Immovable control tie (no lifting instructed).
2. Tap the **Circle / Checkmark** to mark a tie as leveled as you finish it.
3. Tap the **Lock (🔒)** icon on any tie that cannot be moved (e.g. over a tree root, bridge abutment, or road crossing).

---

## 3. The 2 Target Slope Modes

In the alignment bar, choose between two target modes:

```
┌─────────────────┬────────────────────────────────────────────────────────┐
│  [ Grade % ]    │  Holds Station 0 and projects a continuous slope line.  │
│                 │  Quick presets: 0.0% (Flat), 0.5%, 1.0%, or custom.     │
├─────────────────┼────────────────────────────────────────────────────────┤
│  [ End-to-End ] │  Connects start and end ties with straight chords,     │
│                 │  automatically anchored to any Locked Ties (ROOT 🔒).   │
└─────────────────┴────────────────────────────────────────────────────────┘
```

### Mode 1: `Grade %` (Target Grade)
- **Dead Level Benchmark (`0.0%`):** Holds Station 0's elevation flat across the entire section. Best for yard tracks, sidings, and tangent track where no grade change is intended.
- **Inclined Grade (`+0.5%`, `+1.0%`, or negative):** Enters a continuous pitch in percent (e.g. `+0.50%` = 1/2" rise per 100 ft) for hills, ramps, or drainage runoff.

### Mode 2: `End-to-End` (Stringline with Locked Control Ties)
- Draws a straight chord between Station 0 and your final surveyed tie.
- **Locked Ties as Anchors (ROOT):** If intermediate ties are marked with **Lock (🔒)** (e.g. over a tree root or bridge abutment), the grade line breaks into straight segments passing directly through each locked tie, ensuring unmovable points are never forced to lift or lower.

---

## 4. Vertical Profile Chart Controls

Located above the checklist in `ProfileChart.tsx`:

- **Curve vs Straight:**
  - **`Curve` (`<Spline />`):** Uses a Fritsch-Carlson monotone cubic spline that passes smoothly through every station without fake waves or overshoot.
  - **`Straight` (`<TrendingUp />`):** Connects points with direct straight chord lines.
- **Vertical Zoom Sensitivity (`Vert:`):**
  - **`1x` (True Scale):** Real-world flat perspective.
  - **`3x` (Gentle / Default):** Standard track flex view.
  - **`8x` (Noticeable):** High-contrast exaggeration to spot minor sags.
  - **`15x` (Exaggerated):** Extreme magnification for fine 1/16" micro-leveling.
- **Width Toggle:**
  - **`Fit`:** Fits the full track section onto your screen.
  - **`Expand`:** Expands SVG width to allow horizontal touch-scrolling on long track sections.
- **Interactive Inspection:** Hover or tap any point to view distance, reading, elevation, target, and tap **`Edit`** to jump straight into the keypad.

---

## 5. Relocating the Laser (Turning Point / Backsight)

When running out of line-of-sight or moving the tripod down the track, use the **Unified Active Laser** workflow:

### The 3-Step Procedure:
1. **Choose a Solid Tie as your Turning Point (e.g. Station 25 ft):**
   - Take a rod reading with **Laser Setup 1** (e.g. `1' 2"`).
2. **Move the Tripod:**
   - Move the laser tripod further down the track (Laser Setup 2).
   - Place the grade rod back on the **exact same tie** (Station 25 ft) and read the new laser height (e.g. `1' 8"`).
3. **Tap "Move Laser (Datum)" in the App:**
   - Tap the purple **`Move Laser (Datum)`** button in the toolbar (or the Flag icon on the tie).
   - Select the benchmark tie and enter `1' 8"`. Tap **`Apply Laser Relocation`**.

### Unified Active Scale:
- The app calculates the shift ($+6″$) and **automatically converts all earlier measured stations (0 ft to 25 ft) to Laser 2's scale**:
  - Station 0 updates from `1' 2"` $\to$ **`1' 8"`** (with note: `Was: 1' 2" (+6" laser shift)`).
- **Zero Confusion:** If you walk back to Station 0 with your rod receiver right now, **the number on your screen matches your receiver!**
- All elevations and required lifts/lowers remain 100% physically identical.
- Tap **`Revert Laser Move`** in the purple banner if you ever make an entry typo on the turning point.

---

## 6. Extending Track & Feathering Runouts

### The `+ Extend` Button Modal:
Tap the **`+ Extend`** button in the checklist toolbar:
- **`Ahead (Forward →)`:** Appends new stations after the end of your track.
- **`Behind 0 (Backward ←)`:** Inserts negative stations (`-5 ft, -10 ft, -15 ft...`) before Station 0. Use this when you need to "feather" or taper the lift 20–30 feet back into undisturbed track so trains don't hit a bump leading into Station 0.
- Presets: choose length (`+25'`, `+50'`, `+100'`, `+200'`) and interval (`1'`, `2'`, `5'`, `10'`).

### Intermediate Stations & Quick Add:
- **`+ Custom Pt`:** Prompts for any custom distance along the track (e.g. `12.5 ft` at an insulated joint or bridge shoe) and inserts it in sorted numerical order.
- **`Add Next`:** Instantly appends one station at the current interval and opens the keypad.

---

## 7. Data Management, Export & Offline PWA

Tap **`Files / Export`** in the header:
- **Export CSV:**
  - **Download .CSV File:** Saves `{name}_{date}.csv` or triggers the native mobile share sheet (`navigator.share`) on iOS and Android for AirDrop, Files, or messaging.
  - **Copy CSV to Clipboard:** One-tap copy of spreadsheet-ready CSV text.
  - **View Raw CSV Text:** Drawer with full raw CSV text and "Copy All".
- **Import CSV:**
  - Upload a `.csv` file or paste spreadsheet columns from Excel or Google Sheets.
  - Previews station count and provides **`[ Load & Replace Track ]`** to open the survey.
- **Saved Tracks:**
  - Save named profiles to browser storage (`localStorage`).
  - One-tap **Load**, **Download CSV**, and **Delete**.
  - Built-in presets: `"Load Demo 50ft Track (with Dip)"` and `"Reset Track"`.
- **100% Offline PWA:**
  - Track Level Companion operates completely offline in airplane mode. Install to your home screen (iOS: *Share $\to$ Add to Home Screen*; Android: *Install App*) for reliable use deep in rail cuts or remote territory.
