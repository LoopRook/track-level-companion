# Track Level Companion — Field Guide & User Manual

A practical, field-ready handbook for track maintenance crews, surveyors, and mini-railroad / standard gauge operators using **Track Level Companion**.

---

## 1. The Core Laser Principle ("The Rod Rule")

When surveying track with a rotary laser, the laser emits a **perfectly flat plane of light** across the work area. The grade rod rests on top of the rail head.

$$\text{Elevation} = \text{Datum Reference Reading} - \text{Laser Reading}$$

### The Rule to Remember:
```
┌────────────────────────────────────────────────────────────────────────┐
│  HIGHER ROD READING (e.g. 1' 4 1/2")  ──>  Track is LOW   ──>  LIFT    │
│  LOWER ROD READING  (e.g. 1' 0 1/2")  ──>  Track is HIGH  ──>  LOWER   │
└────────────────────────────────────────────────────────────────────────┘
```

Because the grade rod measures downward from the laser plane to the rail head:
- **When track sags (Low):** The rail drops, the rod drops with it, and the laser beam strikes **higher** on the rod's measurement face (e.g. `1' 4 1/2"` instead of benchmark `1' 2"`). The app calculates that the track needs to come up: **`LIFT 2 1/2"`**.
- **When track humps (High):** The rail rises, pushing the rod up, so the laser strikes **lower** on the rod's measurement face (e.g. `1' 0 1/2"`). The app calculates that the rail is high: **`LOWER 1 1/2"`**.

The app handles all inversions automatically, eliminating mental math errors in the field.

---

## 2. Standard 5-Step Field Workflow

### Step 1: Establish Station 0 (Benchmark)
1. Pick your starting reference point (e.g. an existing crossing, switch heel, or undisturbed joint).
2. Mark it **Station 0** in chalk on the tie.
3. Place your grade rod on Station 0 and enter the reading (e.g. `1' 2"`). This sets your baseline datum elevation ($0.00"$).

### Step 2: Walk the Ties & Record Readings
1. Walk down the track at your chosen interval (e.g. Station 5, 10, 15, 20...).
2. Tap each station row or card to open the **Adaptive Input Keypad**:
   - **`Ft, In & 1/16"` Mode:** Tap feet, whole inches, and fraction buttons (e.g. `1'`, `4"`, `3/8"`).
   - **`Inches & 1/16"` Mode:** Tap whole inches directly (e.g. `16"`) and fraction buttons.
   - **`Decimal In` Mode:** Full numeric touch pad (`0-9`, `.`) with instant `+1.0"`, `-1.0"`, `+0.1"`, `-0.1"` micro-steppers.
   - **`Metric (mm)` Mode:** Full millimeter numeric pad (`0-9`) with `+10mm`, `-10mm`, `+1mm`, `-1mm` steppers and real-time inch conversion preview.
3. Check the **Target Badge** at the top of the keypad: it displays the calculated target rod reading and required action (e.g. `🎯 Target: 1' 2 3/8" (Aim: Lift +1/4")`).
4. Tap **`Next Station`** (`→`) — the app saves the reading and automatically advances to the next tie down the line.

### Step 3: Inspect the Vertical Profile Chart
- Glance at the **Track Vertical Profile** chart:
  - **Dips** sag below the dashed green target line.
  - **Humps** peak above the dashed green target line.
  - Switch between **Curve** (smooth flex spline) and **Straight** (chords).
  - Adjust vertical zoom (`1x` true scale up to `15x` micro-precision).

### Step 4: Jacking & Tamping (Checklist Actions)
1. **Choose Your Display Preference (Target Rod vs. Elevation):**
   In the toolbar, toggle between **`Target Rod`**, **`Relative Elev`**, or **`Both`**:
   - **`Target Rod` Mode (Default for Track Crews):** Shows the exact laser rod reading your rod receiver must hit when the tie is jacked into position ($R_{\text{target}} = R_{\text{current}} - \text{Lift}$). Simply raise the rail until your laser receiver beeps on the target mark!
   - **`Relative Elev` Mode:** Shows elevation relative to Station 0 benchmark ($E = \text{Datum} - R$).
   - **`Both` Mode:** Stacks both values so you can see rod readings and physical elevations simultaneously.
   *(Your preference is automatically saved on your device).*
2. Check the **Track Action** column/banner on your checklist:
   - **`ON GRADE ✓`**: Within tolerance (1/16"). Do not touch.
   - **`LIFT 3/8"`**: Jack tie up by 3/8" and tamp ballast underneath.
   - **`LOWER 1/4"`**: Rail is high. Knock down ballast or avoid lifting adjacent ties.
   - **`LOCKED`**: Immovable control tie (no lifting or shimming instructed).
3. Tap the **Circle / Checkmark** to mark a tie as leveled as you finish it.
4. Tap the **Lock (🔒)** icon on any tie that cannot be moved (e.g. over a tree root, bridge abutment, or road crossing).

---

## 3. The 2 Target Slope Modes

In the alignment bar, choose between two target modes:

```
┌─────────────────┬────────────────────────────────────────────────────────┐
│  [ Grade % ]    │  Holds Station 0 and projects a continuous slope line.  │
│                 │  Quick presets: 0.0% (Flat), 0.5%, 1.0%, 1.5%, custom. │
├─────────────────┼────────────────────────────────────────────────────────┤
│  [ End-to-End ] │  Connects start and end ties with straight chords,     │
│                 │  automatically anchored to any Locked Ties (LOCKED 🔒). │
└─────────────────┴────────────────────────────────────────────────────────┘
```

### Mode 1: `Grade %` (Target Grade)
- **Dead Level Benchmark (`0.0%`):** Holds Station 0's elevation flat across the entire section. Best for yard tracks, sidings, and tangent track where no grade change is intended.
- **Quick Presets:** One-tap buttons for **`0.0%`**, **`0.5%`**, **`1.0%`**, and **`1.5%`**.
- **Type Any Custom Grade:** Tap directly into the slope percentage input box to type any custom slope (e.g. `0.25%`, `-0.75%`, `2.0%`).

### Mode 2: `End-to-End` (Stringline with Locked Control Ties)
- Draws a straight chord between Station 0 and your final surveyed tie.
- **Automatic Grade Readouts:**
  - **In the Alignment Bar:** As soon as 2 or more ties are measured, the app displays the resulting grade percentage (e.g. `Grade: +0.42% (+2.5" over 50ft)`).
  - **With Locked Intermediate Ties:** If intermediate ties are marked with **Lock (🔒)** (e.g. over a tree root or bridge abutment), the grade line breaks into straight segments passing directly through each locked tie. The alignment bar displays the **Net Grade** and the slope of each individual chord segment (e.g. `Net: 0.00% • 0'-25': +0.67%, 25'-50': -0.67%`).
- **Handling High Locked Points (Summits):**
  If an unmovable locked point sits higher than your start and end ties, the grade line will rise to it and slope back down, forming a summit. If this creates too sharp of a peak over a short distance (e.g. a 25 ft stretch), expand your survey further down the line (e.g. to 50 or 75 ft) using **`+ Extend`**. This gives the track enough room to feather the rise and fall naturally across more ties, or you can switch to **`Grade %`** to lift the adjoining track up to the high point.

---

## 4. Vertical Profile Chart Controls & Graph Grade Badges

Located above the checklist in `ProfileChart.tsx`:

- **On-Graph Grade Slope Badges:**
  - Every chord segment along the dashed green target line displays an on-screen grade pill (e.g. `+0.67% ↗`, `-0.50% ↘`, `0.00% Grade →`).
  - If locked points exist, each chord shows its individual slope so you immediately see the incline up to a root and the decline down after it.
  - The chart header displays the overall slope summary (e.g. `End-to-End: 0.00% (2 chords)`).
- **Interactive Inspection:** Hover or tap any point to view distance, reading, elevation, target, local design grade, and tap **`Edit`** to jump straight into the keypad.
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

## 7. Data Management, Google Sheets Templates & Offline PWA

Tap **`Files / Export`** in the header to access data tools:

### Field Data Template (Excel / Google Drive / Google Sheets):
Under the **Import CSV** tab:
1. **Download Template (.CSV):** Downloads a pre-formatted field template (`track_template.csv`) with Station, Laser Reading, Completed, Locked, and Notes headers.
2. **Copy for Google Sheets (Clipboard):** Copies tab-separated values (TSV) directly to your clipboard.
   - Open Google Drive $\to$ create a new **Google Sheet** $\to$ press `Ctrl+V` (or `Cmd+V`).
   - The columns paste directly into spreadsheet cells with proper alignment!
   - Take rod readings on your phone or tablet in Google Sheets while walking the track.
   - When finished, either export as `.csv` or select and copy the cells, switch back to Track Level Companion, paste into the text box, and tap **`[ Load & Replace Track ]`**.

### Export Track Data:
- **Download .CSV File:** Saves `{name}_{date}.csv` or opens the native mobile share sheet (`navigator.share`) on iOS and Android for AirDrop, Files, or messaging.
- **Copy CSV to Clipboard:** One-tap copy of clean CSV text.
- **View Raw CSV Text:** Drawer with full raw CSV text and one-click "Copy All".

### Import CSV:
- Upload any `.csv` file or paste spreadsheet rows from Excel or Google Sheets.
- Previews station count, detects columns dynamically, and provides **`[ Load & Replace Track ]`** to open the survey.

### Saved Tracks & Presets:
- Save named profiles to browser storage (`localStorage`).
- One-tap **Load**, **Download CSV**, and **Delete**.
- Built-in presets: `"Load Demo 50ft Track (with Dip)"` and `"Reset Track"`.

### 100% Offline PWA Operation:
- **Zero Internet Required:** Track Level Companion is engineered as an offline Progressive Web App (PWA). All application logic, styles, and calculation engines are precached locally on your device by service workers.
- **Connectivity Indicator:** The top bar displays `📡 Offline` when out of cellular range and `✓ Offline Ready` when cached.
- **Home Screen Installation:**
  - **iOS (Safari):** Tap *Share* $\to$ *Add to Home Screen*.
  - **Android (Chrome):** Tap *Install App* or the three dots $\to$ *Add to Home screen*.
- Runs smoothly in deep rail cuts, remote mountains, and tunnels with zero mobile service.

