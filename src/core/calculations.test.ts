import { describe, it, expect } from 'vitest';
import { parseMeasurement, formatFeetInches, formatInchesFraction, reduceFraction } from './units';
import { calculateTrackProfile, getTrackSummary } from './calculations';
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
});
