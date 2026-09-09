# Track Section Merge Feature (Deactivated)

## Overview

The Track Section Merge feature allows an operator to append an incoming CSV survey or a saved track profile onto the end of the currently active track survey, automatically chaining distances and harmonizing joint ties.

---

## Why It Is Deactivated (Non-User-Facing)

1. **Single-Device / Single-Operator Workflow:**
   In standard field use, an operator does not export a file, start a second file from zero, and merge them. When continuing track, they simply tap **"Extend (+25' / +50')"** at the bottom of the checklist, or **"Extend Before 0"** at the top. This keeps the entire track live under the active rotary laser setup.

2. **Negative Coordinates & Boundary Ambiguities:**
   Tracks often require feathering back before Station 0 (e.g. \-5 ft\, \-10 ft\, \-15 ft\). Merging separate CSV files creates questions around coordinate alignment:
   - Does File B attach before 0 or after the end?
   - If File B contains negative stations, how should the origin offset be resolved?
   - If both files used different rotary laser setups without a benchmark tie, the readings cannot be harmonized without manual backsight calibration.

3. **User Interface Clarity:**
   Exposing "Merge" alongside "Import" led users to believe that importing files *only* supported merging, causing confusion for operators who simply wanted to open/load a saved survey.

---

## Code Architecture & Implementation

The underlying merge engine remains fully implemented and covered by automated unit tests:

### 1. Core Logic (\src/core/csv.ts\)
\\\	ypescript
export function appendStations(
  currentStations: StationPoint[],
  incomingStations: StationPoint[],
  shiftDistances: boolean
): StationPoint[]
\\\
- **Joint Tie Detection:** If Section 1 ends at 50 ft and Section 2 begins at 0 ft, the 0 ft tie from Section 2 is recognized as the common tie point. If Section 1's 50 ft tie already has a laser reading, it is preserved; if it was blank, Section 2's reading is adopted. Section 2's subsequent ties are shifted starting at 55 ft.
- **Distance Shifting:** Offsets all incoming station distances by \lastDist\ to preserve 5-foot spacing.

### 2. Unit Tests (\src/core/csv.test.ts\)
- Verified in unit tests under \describe('appendStations', ...)\:
  - Chaining distances (e.g. 0–50 ft + 0–50 ft -> 0–100 ft).
  - Preserving existing readings on joint ties.
  - Generating unique station IDs for appended rows.

---

## How to Re-Enable in the UI

If multi-crew surveying is needed in the future (e.g. Crew A on Phone 1 and Crew B on Phone 2 wanting to stitch files together):

1. Open \src/components/DataManagementModal.tsx\.
2. Locate the feature flag near the top of the component:
   \\\	ypescript
   const ENABLE_MERGE_FEATURE = false;
   \\\
3. Change it to \	rue\:
   \\\	ypescript
   const ENABLE_MERGE_FEATURE = true;
   \\\
4. This will:
   - Re-enable the **\[ Merge / Append to End ]\** button in the CSV import resolution card.
   - Re-enable the **\+ Merge\** quick-append button on each saved profile card in the Saved Tracks tab.
