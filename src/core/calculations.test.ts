import { describe, it, expect } from 'vitest';
import { parseMeasurement, formatFeetInches, formatInchesFraction, reduceFraction } from './units';
import { calculateTrackProfile, getTrackSummary, calculateGradeInfo } from './calculations';
import { TrackProject } from './types';

describe('Units and Fraction Parsing', () => {
  it('parses feet, inches, and fractions accurately', () => {
    expect(parseMeasurement(`1' 4 3/8"`)).toBeCloseTo(16.375, 4);
    expect(parseMeasurement(`0' 8 1/2"`)).toBeCloseTo(8.5, 4);
    expect(parseMeasurement(`2' 0"`)).toBeCloseTo(24.0, 4);
    expect(parseMeasurement(`14 1/4"`)).toBeCloseTo(14.25, 4);
    expect(parseMeasurement(`14 1/4`)).toBeCloseTo(14.25, 4);
    expect(parseMeasurement(`16-3/8`)).toBeCloseTo(16.375, 4);
    expect(parseMeasurement(`1-4-3/8`)).toBeCloseTo(16.375, 4);
    expect(parseMeasurement(`14.375`)).toBeCloseTo(14.375, 4);
    expect(parseMeasurement(`0`)).toBe(0);
    expect(parseMeasurement(`-1/4"`)).toBeCloseTo(-0.25, 4);
  });

  it('formats decimal inches back to feet-inches-fractions', () => {
    expect(formatFeetInches(16.375)).toBe(`1' 4 3/8"`);
    expect(formatFeetInches(8.5)).toBe(`8 1/2"`);
    expect(formatFeetInches(24.0)).toBe(`2' 0"`);
    expect(formatFeetInches(0)).toBe(`0"`);
    expect(formatFeetInches(-0.25)).toBe(`-1/4"`);
  });

  it('formats decimal inches to total inches and fractions', () => {
    expect(formatInchesFraction(16.375)).toBe(`16 3/8"`);
    expect(formatInchesFraction(8.5)).toBe(`8 1/2"`);
    expect(formatInchesFraction(0.0625)).toBe(`1/16"`);
  });

  it('reduces fractions properly', () => {
    expect(reduceFraction(4, 16)).toEqual([1, 4]);
    expect(reduceFraction(8, 16)).toEqual([1, 2]);
    expect(reduceFraction(6, 16)).toEqual([3, 8]);
    expect(reduceFraction(12, 16)).toEqual([3, 4]);
  });
});

describe('Laser Datum & Track Profile Calculations', () => {
  const baseProject: TrackProject = {
    id: 'test-project',
    name: 'Test Project',
    date: '2026-09-08',
    gauge: '7 1/4"',
    unitFormat: 'feet_inches_fraction',
    fractionResolution: 16,
    toleranceInches: 0.0625, // 1/16"
    stationIntervalFt: 5,
    laserDatumMode: 'relative_to_first',
    gradeMode: 'target_grade',
    targetGradePercent: 0.0, // flat level
    stations: [
      { id: '1', distanceFt: 0, readingInches: 12.0 },   // Station 0: 12" reading -> baseline elevation 0
      { id: '2', distanceFt: 5, readingInches: 12.375 }, // Station 5: 12 3/8" reading -> 3/8" dip (lower)
      { id: '3', distanceFt: 10, readingInches: 11.875 },// Station 10: 11 7/8" reading -> 1/8" hump (higher)
      { id: '4', distanceFt: 15, readingInches: 12.0 },  // Station 15: 12.0" -> on grade
    ]
  };

  it('inverts laser readings correctly into physical elevation', () => {
    const calculated = calculateTrackProfile(baseProject);

    // Station 0: baseline (elev = 0)
    expect(calculated[0].elevationInches).toBeCloseTo(0, 4);

    // Station 5: reading is 12.375 (further down from laser -> lower track)
    expect(calculated[1].elevationInches).toBeCloseTo(-0.375, 4);

    // Station 10: reading is 11.875 (closer to laser -> higher track)
    expect(calculated[2].elevationInches).toBeCloseTo(0.125, 4);
  });

  it('determines correct lift and lower recommendations for flat 0% grade', () => {
    const calculated = calculateTrackProfile(baseProject);

    // Station 0: Target = 0, Elev = 0 => On Grade
    expect(calculated[0].action).toBe('ok');
    expect(calculated[0].actionText).toBe('ON GRADE ✓');

    // Station 5: Target = 0, Elev = -0.375 => Lift by +3/8"
    expect(calculated[1].action).toBe('lift');
    expect(calculated[1].liftInches).toBeCloseTo(0.375, 4);
    expect(calculated[1].actionText).toBe(`LIFT +3/8"`);

    // Station 10: Target = 0, Elev = +0.125 => Lower by -1/8"
    expect(calculated[2].action).toBe('lower');
    expect(calculated[2].liftInches).toBeCloseTo(-0.125, 4);
    expect(calculated[2].actionText).toBe(`LOWER -1/8"`);

    // Station 15: Target = 0, Elev = 0 => On Grade
    expect(calculated[3].action).toBe('ok');

    // Verify Target Rod Readings on 0% Flat Grade
    // On flat grade, every station's target rod reading must equal baseline datum reading (12.0")
    expect(calculated[0].targetReadingInches).toBeCloseTo(12.0, 4);
    expect(calculated[1].targetReadingInches).toBeCloseTo(12.0, 4);
    expect(calculated[2].targetReadingInches).toBeCloseTo(12.0, 4);
    expect(calculated[3].targetReadingInches).toBeCloseTo(12.0, 4);
  });

  it('calculates targetReadingInches accurately across grades, locked ties, and unmeasured stations', () => {
    // 1% climbing grade (0.12 in/ft rise)
    const gradeProject: TrackProject = {
      ...baseProject,
      targetGradePercent: 1.0,
      stations: [
        { id: '1', distanceFt: 0, readingInches: 14.0 },   // Station 0: 14.0" reading -> datum baseline
        { id: '2', distanceFt: 10, readingInches: 14.5 },  // Station 10: 14.5" reading (dip)
        { id: '3', distanceFt: 20, readingInches: 11.6, isLocked: true }, // Locked tie at 20 ft
        { id: '4', distanceFt: 30, readingInches: null },  // Unmeasured station at 30 ft
      ]
    };

    const calculated = calculateTrackProfile(gradeProject);

    // Station 0 (d=0): Target elev = 0. Target rod = 14.0"
    expect(calculated[0].targetReadingInches).toBeCloseTo(14.0, 4);

    // Station 10 (d=10): Target elev = 10 * 0.12 = +1.20".
    // Rod reading required to be 1.2" higher: 14.0 - 1.20 = 12.80"
    expect(calculated[1].targetReadingInches).toBeCloseTo(12.80, 4);
    // Current reading is 14.5, so lift is 14.5 - 12.8 = 1.70"
    expect(calculated[1].liftInches).toBeCloseTo(1.70, 4);

    // Station 20 (Locked tie): Target reading must equal current reading because it cannot be moved
    expect(calculated[2].targetReadingInches).toBeCloseTo(11.6, 4);

    // Station 30 (Unmeasured): Target elev = 30 * 0.12 = +3.60".
    // Pre-calculated target rod: 14.0 - 3.60 = 10.40"
    expect(calculated[3].targetReadingInches).toBeCloseTo(10.40, 4);
  });

  it('calculates 1.0% climbing grade correctly', () => {
    const gradeProject: TrackProject = {
      ...baseProject,
      targetGradePercent: 1.0, // 1% grade = 1 ft rise per 100 ft = 0.12 inches rise per ft
      stations: [
        { id: '1', distanceFt: 0, readingInches: 20.0 },
        { id: '2', distanceFt: 10, readingInches: 20.0 }, // Still at 20", but at 10ft should be 1.2" higher
      ]
    };

    const calculated = calculateTrackProfile(gradeProject);
    // At station 10, target elevation should be 10 * (1% / 100) * 12 = 1.2 inches
    expect(calculated[1].targetElevationInches).toBeCloseTo(1.2, 4);
    // Current elevation is 0 (since reading is still 20.0)
    // Lift needed should be +1.2 inches
    expect(calculated[1].liftInches).toBeCloseTo(1.2, 4);
    expect(calculated[1].action).toBe('lift');
  });

  it('calculates best-fit regression line correctly', () => {
    const bestFitProject: TrackProject = {
      ...baseProject,
      gradeMode: 'best_fit',
      stations: [
        { id: '1', distanceFt: 0, readingInches: 10.0 },  // y = 0
        { id: '2', distanceFt: 10, readingInches: 12.0 }, // y = -2
        { id: '3', distanceFt: 20, readingInches: 14.0 }, // y = -4
      ]
    };

    const calculated = calculateTrackProfile(bestFitProject);
    // A perfect straight line down 2" every 10 ft:
    expect(calculated[0].liftInches).toBeCloseTo(0, 4);
    expect(calculated[1].liftInches).toBeCloseTo(0, 4);
    expect(calculated[2].liftInches).toBeCloseTo(0, 4);
    expect(calculated[0].action).toBe('ok');
    expect(calculated[1].action).toBe('ok');
    expect(calculated[2].action).toBe('ok');
  });

  it('produces accurate summary statistics', () => {
    const calculated = calculateTrackProfile(baseProject);
    const summary = getTrackSummary(calculated);

    expect(summary.totalStations).toBe(4);
    expect(summary.measuredCount).toBe(4);
    expect(summary.completedCount).toBe(0);
    expect(summary.onGradeCount).toBe(2);
    expect(summary.liftCount).toBe(1);
    expect(summary.lowerCount).toBe(1);
    expect(summary.maxLift).toBeCloseTo(0.375, 4);
    expect(summary.maxLower).toBeCloseTo(0.125, 4);
    expect(summary.lengthFt).toBe(15);
  });

  it('accurately adjusts elevations when laser is relocated with a datum offset (turning point)', () => {
    // Setup: Station 0 and 50 are leveled with laser 1 (reading 14.0").
    // Laser is moved forward: laser 2 is 2.5" higher, so reading on Station 50 with laser 2 is 16.5".
    // Station 60 has reading 16.5" with laser 2 (which means physically same height as station 50).
    const turningPointProject: TrackProject = {
      ...baseProject,
      stations: [
        { id: '1', distanceFt: 0, readingInches: 14.0, datumOffsetInches: 0 },
        { id: '2', distanceFt: 50, readingInches: 14.0, datumOffsetInches: 0, isTurningPoint: true },
        // Laser 2 readings with datumOffsetInches = 2.5:
        { id: '3', distanceFt: 60, readingInches: 16.5, datumOffsetInches: 2.5 },
      ]
    };

    const calculated = calculateTrackProfile(turningPointProject);
    // Effective reading for station 60 should be 16.5 - 2.5 = 14.0"
    expect(calculated[2].effectiveReadingInches).toBeCloseTo(14.0, 4);
    // Elevation should be 0 (identical to station 0 and 50), NOT -2.5"
    expect(calculated[2].elevationInches).toBeCloseTo(0.0, 4);
    expect(calculated[2].liftInches).toBeCloseTo(0.0, 4);
    expect(calculated[2].action).toBe('ok');
  });

  it('respects locked control points over tree roots and interpolates piecewise in end_to_end mode', () => {
    // Station 0: baseline (elev = 0)
    // Station 10: over a tree root (+0.5" hump), locked so we cannot lower it!
    // Station 20: end benchmark (elev = 0)
    // Station 5: intermediate point between 0 and root
    // Station 15: intermediate point between root and 20
    const lockedProject: TrackProject = {
      ...baseProject,
      gradeMode: 'end_to_end',
      stations: [
        { id: '0', distanceFt: 0, readingInches: 12.0 },    // elev = 0
        { id: '5', distanceFt: 5, readingInches: 12.0 },    // elev = 0
        { id: '10', distanceFt: 10, readingInches: 11.5, isLocked: true }, // elev = +0.5" (root hump)
        { id: '15', distanceFt: 15, readingInches: 12.0 },  // elev = 0
        { id: '20', distanceFt: 20, readingInches: 12.0 },  // elev = 0
      ]
    };

    const calculated = calculateTrackProfile(lockedProject);

    // Root station (10 ft) must be locked with 0 cut/lift and target = actual
    expect(calculated[2].isLocked).toBe(true);
    expect(calculated[2].elevationInches).toBeCloseTo(0.5, 4);
    expect(calculated[2].targetElevationInches).toBeCloseTo(0.5, 4);
    expect(calculated[2].liftInches).toBeCloseTo(0.0, 4);
    expect(calculated[2].action).toBe('ok');
    expect(calculated[2].actionText).toBe('LOCKED 🔒');

    // Intermediate Station at 5 ft: connects 0 ft (elev 0) to 10 ft (elev 0.5)
    // Target elevation at 5 ft should be +0.25"
    expect(calculated[1].targetElevationInches).toBeCloseTo(0.25, 4);
    // Since actual elevation is 0, lift needed is +0.25"
    expect(calculated[1].liftInches).toBeCloseTo(0.25, 4);
    expect(calculated[1].action).toBe('lift');

    // Intermediate Station at 15 ft: connects 10 ft (elev 0.5) to 20 ft (elev 0)
    // Target elevation at 15 ft should be +0.25"
    expect(calculated[3].targetElevationInches).toBeCloseTo(0.25, 4);
    expect(calculated[3].liftInches).toBeCloseTo(0.25, 4);
    expect(calculated[3].action).toBe('lift');
  });

  it('handles negative distance stations behind Station 0 maintaining baseline at Station 0', () => {
    const negativeStationsProject: TrackProject = {
      ...baseProject,
      gradeMode: 'target_grade',
      targetGradePercent: 0.0, // flat
      stations: [
        { id: 'neg-10', distanceFt: -10, readingInches: 14.0 },  // level with Station 0
        { id: 'neg-5', distanceFt: -5, readingInches: 14.25 },   // 1/4" dip
        { id: '0', distanceFt: 0, readingInches: 14.0 },         // Station 0 baseline
        { id: '10', distanceFt: 10, readingInches: 14.0 },       // level with Station 0
      ]
    };

    const calculated = calculateTrackProfile(negativeStationsProject);

    // Station 0 must remain baseline Elevation 0.00"
    expect(calculated[2].distanceFt).toBe(0);
    expect(calculated[2].elevationInches).toBeCloseTo(0.0, 4);
    expect(calculated[2].action).toBe('ok');

    // Station -10 is physically same height as Station 0 (reading 14.0)
    expect(calculated[0].distanceFt).toBe(-10);
    expect(calculated[0].elevationInches).toBeCloseTo(0.0, 4);
    expect(calculated[0].action).toBe('ok');

    // Station -5 is 1/4" lower (reading 14.25)
    expect(calculated[1].distanceFt).toBe(-5);
    expect(calculated[1].elevationInches).toBeCloseTo(-0.25, 4);
    expect(calculated[1].liftInches).toBeCloseTo(0.25, 4);
    expect(calculated[1].action).toBe('lift');
    expect(calculated[1].actionText).toBe('LIFT +1/4"');
  });

  it('dynamically propagates datum shift to subsequent stations when tpNewReadingInches is recorded on a benchmark', () => {
    // Scenario:
    // Station 0: reading 12.0" (Laser 1) -> baseline elev = 0
    // Station 25: reading 12.0" (Laser 1) -> physical elev = 0
    // Laser is moved. On Station 25, backsight with Laser 2 is 14.5" (Laser 2 is 2.5" higher).
    // Stations 30 and 35 are added afterwards with NO pre-stamped datumOffsetInches!
    // Station 30 reads 14.5" with Laser 2 (physically level with Station 25).
    // Station 35 reads 14.75" with Laser 2 (physically 1/4" lower dip).
    const dynamicTpProject: TrackProject = {
      ...baseProject,
      stations: [
        { id: '0', distanceFt: 0, readingInches: 12.0 },
        {
          id: '25',
          distanceFt: 25,
          readingInches: 12.0,
          isTurningPoint: true,
          tpNewReadingInches: 14.5, // 2.5" shift
        },
        { id: '30', distanceFt: 30, readingInches: 14.5 }, // no datumOffsetInches
        { id: '35', distanceFt: 35, readingInches: 14.75 }, // no datumOffsetInches
        { id: '40', distanceFt: 40, readingInches: null },  // unmeasured station
      ]
    };

    const calculated = calculateTrackProfile(dynamicTpProject);

    // Turning point tie at 25 ft retains Laser 1 baseline reading (effective = 12.0, elev = 0)
    expect(calculated[1].appliedDatumOffsetInches).toBeCloseTo(0.0, 4);
    expect(calculated[1].effectiveReadingInches).toBeCloseTo(12.0, 4);
    expect(calculated[1].elevationInches).toBeCloseTo(0.0, 4);
    expect(calculated[1].action).toBe('ok');

    // Station 30 inherits +2.5" datum offset dynamically!
    expect(calculated[2].appliedDatumOffsetInches).toBeCloseTo(2.5, 4);
    expect(calculated[2].effectiveReadingInches).toBeCloseTo(12.0, 4); // 14.5 - 2.5 = 12.0
    expect(calculated[2].elevationInches).toBeCloseTo(0.0, 4);
    expect(calculated[2].action).toBe('ok');

    // Station 35 inherits +2.5" datum offset dynamically!
    expect(calculated[3].appliedDatumOffsetInches).toBeCloseTo(2.5, 4);
    expect(calculated[3].effectiveReadingInches).toBeCloseTo(12.25, 4); // 14.75 - 2.5 = 12.25
    expect(calculated[3].elevationInches).toBeCloseTo(-0.25, 4);
    expect(calculated[3].liftInches).toBeCloseTo(0.25, 4);
    expect(calculated[3].action).toBe('lift');
    expect(calculated[3].actionText).toBe('LIFT +1/4"');

    // Unmeasured Station 40 also has the active offset ready
    expect(calculated[4].appliedDatumOffsetInches).toBeCloseTo(2.5, 4);
    expect(calculated[4].effectiveReadingInches).toBeNull();
  });

  it('chains multiple turning points seamlessly across consecutive laser relocations', () => {
    // Setup 1 (Laser 1): 0ft (12"), 20ft (12")
    // TP 1 at 20ft: Laser 2 reads 15.0" (+3.0" shift)
    // Setup 2 (Laser 2): 30ft (15.0"), 40ft (15.0")
    // TP 2 at 40ft: Laser 3 reads 17.5" (+2.5" shift -> total +5.5" shift)
    // Setup 3 (Laser 3): 50ft (17.5")
    const multiTpProject: TrackProject = {
      ...baseProject,
      stations: [
        { id: '0', distanceFt: 0, readingInches: 12.0 },
        { id: '20', distanceFt: 20, readingInches: 12.0, isTurningPoint: true, tpNewReadingInches: 15.0 },
        { id: '30', distanceFt: 30, readingInches: 15.0 },
        { id: '40', distanceFt: 40, readingInches: 15.0, isTurningPoint: true, tpNewReadingInches: 17.5 },
        { id: '50', distanceFt: 50, readingInches: 17.5 },
      ]
    };

    const calculated = calculateTrackProfile(multiTpProject);

    // All stations are physically level (elev = 0)
    expect(calculated[0].elevationInches).toBeCloseTo(0.0, 4);
    expect(calculated[1].elevationInches).toBeCloseTo(0.0, 4);
    expect(calculated[2].elevationInches).toBeCloseTo(0.0, 4);
    expect(calculated[3].elevationInches).toBeCloseTo(0.0, 4);
    expect(calculated[4].elevationInches).toBeCloseTo(0.0, 4);

    // Offsets:
    expect(calculated[0].appliedDatumOffsetInches).toBeCloseTo(0.0, 4);
    expect(calculated[1].appliedDatumOffsetInches).toBeCloseTo(0.0, 4);
    expect(calculated[2].appliedDatumOffsetInches).toBeCloseTo(3.0, 4);
    expect(calculated[3].appliedDatumOffsetInches).toBeCloseTo(3.0, 4);
    expect(calculated[4].appliedDatumOffsetInches).toBeCloseTo(5.5, 4);

    // Effective readings normalized to Laser 1:
    expect(calculated[0].effectiveReadingInches).toBeCloseTo(12.0, 4);
    expect(calculated[1].effectiveReadingInches).toBeCloseTo(12.0, 4);
    expect(calculated[2].effectiveReadingInches).toBeCloseTo(12.0, 4);
    expect(calculated[3].effectiveReadingInches).toBeCloseTo(12.0, 4);
    expect(calculated[4].effectiveReadingInches).toBeCloseTo(12.0, 4);
  });

  it('correctly normalizes a turning point tie whose reading is updated to the new backsight reading', () => {
    // Station 0: 14.0" (Laser 1)
    // Station 25: measured at 14.0" with Laser 1. Moved laser, now reads 20.0" (1' 8").
    // The tie's readingInches is updated to 20.0", with datumOffsetInches = 6.0 and tpOldReadingInches = 14.0.
    // Station 30: measured with Laser 2 as 20.0" (1' 8").
    const updatedTpProject: TrackProject = {
      ...baseProject,
      stations: [
        { id: '0', distanceFt: 0, readingInches: 14.0 },
        {
          id: '25',
          distanceFt: 25,
          readingInches: 20.0,
          isTurningPoint: true,
          datumOffsetInches: 6.0,
          tpOldReadingInches: 14.0,
          tpNewReadingInches: 20.0,
        },
        { id: '30', distanceFt: 30, readingInches: 20.0 },
        { id: '35', distanceFt: 35, readingInches: null },
      ]
    };

    const calculated = calculateTrackProfile(updatedTpProject);

    // Station 25 should be ON GRADE, effective reading 14.0", elevation 0.0"
    expect(calculated[1].readingInches).toBe(20.0);
    expect(calculated[1].appliedDatumOffsetInches).toBe(6.0);
    expect(calculated[1].effectiveReadingInches).toBeCloseTo(14.0, 4);
    expect(calculated[1].elevationInches).toBeCloseTo(0.0, 4);
    expect(calculated[1].action).toBe('ok');

    // Station 30 should also be ON GRADE, effective reading 14.0", elevation 0.0"
    expect(calculated[2].readingInches).toBe(20.0);
    expect(calculated[2].appliedDatumOffsetInches).toBe(6.0);
    expect(calculated[2].effectiveReadingInches).toBeCloseTo(14.0, 4);
    expect(calculated[2].elevationInches).toBeCloseTo(0.0, 4);
    expect(calculated[2].action).toBe('ok');
  });

  it('correctly handles the Unified Active Laser Relocation workflow where prior ties convert to current laser scale', () => {
    // Setup 1 (Laser 1):
    // Station 0: 14.0" (1' 2") -> baseline elev = 0
    // Station 5: 14.25" (1' 2 1/4") -> 1/4" dip
    // Station 25: 14.0" (1' 2") -> level
    // Laser is relocated: Tripod is set up 6" higher.
    // Benchmark backsight on Station 25 reads 20.0" (1' 8").
    // Under the unified workflow, stations 0, 5, 25 are converted by +6.0":
    // Station 0 becomes 20.0" (1' 8"), Station 5 becomes 20.25" (1' 8 1/4"), Station 25 becomes 20.0" (1' 8").
    // Station 30 is subsequently measured with Laser 2 as 20.25" (1' 8 1/4").
    const unifiedProject: TrackProject = {
      ...baseProject,
      stations: [
        { id: '0', distanceFt: 0, readingInches: 20.0, datumOffsetInches: 6.0 },
        { id: '5', distanceFt: 5, readingInches: 20.25, datumOffsetInches: 6.0 },
        {
          id: '25',
          distanceFt: 25,
          readingInches: 20.0,
          datumOffsetInches: 6.0,
          isTurningPoint: true,
          tpOldReadingInches: 14.0,
          tpNewReadingInches: 20.0,
        },
        { id: '30', distanceFt: 30, readingInches: 20.25 }, // shot directly under Laser 2
        { id: '35', distanceFt: 35, readingInches: null },  // unmeasured
      ]
    };

    const calculated = calculateTrackProfile(unifiedProject);

    // 1. Station 0 reads 20.0" (1' 8") matching the physical rod receiver under Laser 2
    expect(calculated[0].readingInches).toBe(20.0);
    expect(calculated[0].elevationInches).toBeCloseTo(0.0, 4);
    expect(calculated[0].action).toBe('ok');

    // 2. Station 5 reads 20.25" (1' 8 1/4") and retains its exact 1/4" dip
    expect(calculated[1].readingInches).toBe(20.25);
    expect(calculated[1].elevationInches).toBeCloseTo(-0.25, 4);
    expect(calculated[1].liftInches).toBeCloseTo(0.25, 4);
    expect(calculated[1].action).toBe('lift');
    expect(calculated[1].actionText).toBe('LIFT +1/4"');

    // 3. Station 25 benchmark tie is ON GRADE
    expect(calculated[2].readingInches).toBe(20.0);
    expect(calculated[2].elevationInches).toBeCloseTo(0.0, 4);
    expect(calculated[2].action).toBe('ok');

    // 4. Station 30 measured with Laser 2 needs +1/4" lift, completely consistent with stations 0 & 25
    expect(calculated[3].readingInches).toBe(20.25);
    expect(calculated[3].elevationInches).toBeCloseTo(-0.25, 4);
    expect(calculated[3].liftInches).toBeCloseTo(0.25, 4);
    expect(calculated[3].action).toBe('lift');
    expect(calculated[3].actionText).toBe('LIFT +1/4"');

    // 5. Unmeasured station 35 is clean
    expect(calculated[4].readingInches).toBeNull();
    expect(calculated[4].elevationInches).toBeNull();
  });

  it('calculates end-to-end grade accurately when there are no intermediate locked points', () => {
    const project: TrackProject = {
      ...baseProject,
      gradeMode: 'end_to_end',
      stations: [
        { id: '0', distanceFt: 0, readingInches: 15.0 },    // Elev 0.0"
        { id: '25', distanceFt: 25, readingInches: 13.5 },  // Elev +1.5"
        { id: '50', distanceFt: 50, readingInches: 12.0 },  // Elev +3.0" (rises 3" over 50ft = +0.50%)
      ],
    };

    const calculated = calculateTrackProfile(project);
    const gradeInfo = calculateGradeInfo(calculated, 'end_to_end');

    expect(gradeInfo).not.toBeNull();
    expect(gradeInfo!.overallGradePercent).toBeCloseTo(0.50, 2);
    expect(gradeInfo!.overallElevChangeInches).toBeCloseTo(3.0, 2);
    expect(gradeInfo!.totalLengthFt).toBe(50);
    expect(gradeInfo!.hasLockedPoints).toBe(false);
    expect(gradeInfo!.segments.length).toBe(1);
    expect(gradeInfo!.segments[0].gradePercent).toBeCloseTo(0.50, 2);
  });

  it('calculates piecewise segment grades when an intermediate control point is locked (e.g. over a tree root)', () => {
    // Station 0: Elev 0.0"
    // Station 25: Locked over root with Elev +1.5" (rises 1.5" over 25ft = +0.50%)
    // Station 50: Ends at Elev 0.0" (drops 1.5" over 25ft = -0.50%)
    // Overall net: 0.00%
    const project: TrackProject = {
      ...baseProject,
      gradeMode: 'end_to_end',
      stations: [
        { id: '0', distanceFt: 0, readingInches: 14.0 },
        { id: '25', distanceFt: 25, readingInches: 12.5, isLocked: true }, // 1.5" higher
        { id: '50', distanceFt: 50, readingInches: 14.0 },
      ],
    };

    const calculated = calculateTrackProfile(project);
    const gradeInfo = calculateGradeInfo(calculated, 'end_to_end');

    expect(gradeInfo).not.toBeNull();
    expect(gradeInfo!.hasLockedPoints).toBe(true);
    expect(gradeInfo!.overallGradePercent).toBeCloseTo(0.00, 2);
    expect(gradeInfo!.segments.length).toBe(2);

    // Segment 1 (0' to 25') climbs up to the root
    expect(gradeInfo!.segments[0].startDistanceFt).toBe(0);
    expect(gradeInfo!.segments[0].endDistanceFt).toBe(25);
    expect(gradeInfo!.segments[0].gradePercent).toBeCloseTo(0.50, 2);
    expect(gradeInfo!.segments[0].elevChangeInches).toBeCloseTo(1.5, 2);

    // Segment 2 (25' to 50') slopes back down after the root
    expect(gradeInfo!.segments[1].startDistanceFt).toBe(25);
    expect(gradeInfo!.segments[1].endDistanceFt).toBe(50);
    expect(gradeInfo!.segments[1].gradePercent).toBeCloseTo(-0.50, 2);
    expect(gradeInfo!.segments[1].elevChangeInches).toBeCloseTo(-1.5, 2);
  });
});


