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
│  SMALL NUMBER ON ROD ──>  Track has a HUMP / HIGH   ──>  APP: LOWER    │
└────────────────────────────────────────────────────────────────────────┘
```

- **When track sags:** The rail drops $\to$ the rod drops $\to$ the laser hits higher up on the measurement face (e.g. `1' 4 1/2"` instead of `1' 2"`). The app tells you: **`LIFT 2 1/2"`**.
- **When track humps:** The rail rises $\to$ the rod is pushed up $\to$ the laser hits lower down on the rod (e.g. `1' 0 1/2"`). The app tells you: **`LOWER 1 1/2"`**.

The app handles all inversions automatically, eliminating mental math errors in the field.

---

## 2. Standard 5-Step Field Workflow

### Step 1: Establish Station 0 (Benchmark)
1. Pick your starting reference point (e.g. an existing crossing, switch heel, or undisturbed joint).
2. Mark it **Station 0** in chalk on the tie.
3. Place your grade rod on Station 0 and enter the reading (e.g. `1' 2"`). This sets your baseline datum elevation.

### Step 2: Walk the Ties & Record Readings
1. Walk down the track at 5-foot intervals (Station 5, 10, 15, 20...).
2. Tap each station in the app to open the **Rapid Fraction Keypad**.
3. Type the feet, inches, and fractions (e.g. `1'` `4"` `3/8"`).
4. Tap **`Save & Next`** — the app immediately saves and auto-advances to the next tie down the line.

### Step 3: Inspect the Profile & Slopes
- Glance at the **Gentle Graph** profile chart:
  - **Dips** appear below the target line.
  - **Humps** appear above the target line.
  - The live summary banner reports: Track Length, % On-Grade, Max Lift, and Max Lower.

### Step 4: Jacking & Tamping
1. Look at the **Action Column** on your checklist:
   - **`ON GRADE (✓)`** (Green): Within tolerance (1/16" or 1/8"). Do not touch.
   - **`LIFT 3/8"`** (Amber): Jack tie up by 3/8" and tamp ballast underneath.
   - **`LOWER 1/4"`** (Blue): Rail is high. Knock down ballast or avoid lifting adjacent ties.
2. Tap the **Checkmark (✓)** to mark a tie as leveled as you finish it.
3. Tap the **Lock (🔒)** icon on any tie that cannot be moved (e.g. over a tree root, bridge abutment, or road crossing).

---

## 3. The 4 Target Slope Modes

Select your target grade line from the **Slope Mode** dropdown in the top header:

| Slope Mode | How It Works | Best Used For |
| :--- | :--- | :--- |
| **1. Fixed Benchmark (0.0%)** | Holds Station 0's elevation dead level across the entire section. | Yard tracks, sidings, flat tangent tracks. |
| **2. Target Grade (% Slope)** | Creates a continuous pitch at your dialed % (e.g. `+0.50%` rise or `-1.0%` fall). | Hills, drainage runoffs, approaches to bridges. |
| **3. Best Fit (Smoothing)** | Runs linear regression across all measured ties to find the natural average plane. | Resurfacing existing track with minimal ballast lifting. |
| **4. Two-Point Chord** | Draws a straight stringline between Station 0 and your final surveyed tie. | Connecting two fixed end-points (e.g. between two crossings). |

---

## 4. Relocating the Laser (Turning Point / Backsight)

When your survey exceeds the line-of-sight of your laser, or trees/curves block the beam, you must relocate the laser tripod.

### The 3-Step Physical Procedure:
1. **Choose a Solid Tie as your Turning Point (e.g. Station 25 ft):**
   - Take a rod reading with **Laser Setup 1** (e.g. `1' 2"`).
2. **Move the Tripod:**
   - Move the laser tripod further down the track (Laser Setup 2).
   - Place the grade rod back on the **exact same tie** (Station 25 ft) and read the new laser height (e.g. `1' 8"`).
3. **Tap "Move Laser" in the App:**
   - Tap **Move Laser** on Station 25 and enter `1' 8"`.

### Unified Active Scale:
- The app calculates the shift ($+6″$) and **automatically updates all previously measured stations (0 ft to 25 ft) to Laser 2's scale**:
  - Station 0 updates from `1' 2"` $\to$ **`1' 8"`** (with note: `Was: 1' 2" (+6" shift)`).
- **Why this matters:** If you walk back to Station 0 with your rod receiver right now, **the number on your screen matches the reading on your rod!**
- All target slopes and required lifts remain 100% physically identical.
- If you ever make a typo on the turning point, tap **`Revert Laser Move`** in the top banner to restore original readings.

---

## 5. Extending Track & Feathering Runouts

### Extending Forward:
- At the bottom of the checklist, tap **`+25 ft`** or **`+50 ft`** to append the next set of 5-foot stations.
- Tap **`+ Add Custom Station`** to insert intermediate distances (e.g. `12.5 ft` at an insulated joint).

### Extending Before 0 (Feathering Runout):
- When lifting a dip near Station 0, you often need to "feather" or taper the lift 20–30 feet back into undisturbed track so trains don't hit a sudden ramp.
- Tap **`Extend Before 0 (-25 ft)`** at the top of the table.
- Inserts `-5 ft, -10 ft, -15 ft, -20 ft, -25 ft` at the top of the list without changing the name or chalk mark of your physical Station 0 tie.

---

## 6. Data Management, Export & Offline PWA

### Exporting & Sharing:
- Tap **`Files / Export`**:
  - **Mobile Share:** On iOS / Android, tapping **Download CSV** opens the native share sheet to save directly to Files, email, or AirDrop.
  - **Copy to Clipboard:** Copies spreadsheet-ready CSV text with one tap.
  - **View Raw CSV:** Preview the exact CSV text anytime.

### Importing Saved Tracks:
- Under **`Import CSV`**, upload a `.csv` file or paste spreadsheet columns from Excel or Google Sheets.
- The app confirms the number of stations found and loads the profile directly onto your screen.

### 100% Offline Capability:
- Track Level Companion is a certified Progressive Web App (PWA).
- Add it to your home screen (iOS: *Share $\to$ Add to Home Screen*; Android: *Install App*).
- Operates fully in airplane mode deep in cuts, trees, or tunnels with zero internet connection.
