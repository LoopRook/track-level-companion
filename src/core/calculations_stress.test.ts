import { describe, it, expect } from 'vitest';
import { calculateTrackProfile, getTrackSummary, calculateGradeInfo } from './calculations';
import { TrackProject, StationPoint } from './types';

const BASE_PROJECT: TrackProject = {
  id: 'test-stress-project',
  name: 'Stress Test Project',
  date: '2026-09-11',
  gauge: '7 1/4"',
  unitFormat: 'decimal_inches',
  fractionResolution: 16,
  toleranceInches: 0.0625,
  stationIntervalFt: 5,
  laserDatumMode: 'relative_to_first',
  gradeMode: 'end_to_end',
  targetGradePercent: 0.0,
  stations: [],
};

describe('Suite 1: Calculation Engine Stress Tests & Boundary Edge Cases', () => {
  it('handles completely empty project (0 stations)', () => {
    const calc = calculateTrackProfile({ ...BASE_PROJECT, stations: [] });
    expect(calc).toEqual([]);

    const summary = getTrackSummary(calc);
    expect(summary.totalStations).toBe(0);
    expect(summary.measuredCount).toBe(0);
    expect(summary.onGradeCount).toBe(0);
    expect(summary.liftCount).toBe(0);
    expect(summary.maxLift).toBe(0);

    const gradeInfo = calculateGradeInfo(calc, 'end_to_end', 0);
    expect(gradeInfo).toBeNull();
  });

  it('handles single measured station (loner benchmark datum)', () => {
    const stations: StationPoint[] = [
      { id: 's0', distanceFt: 0, readingInches: 5.5 },
      { id: 's5', distanceFt: 5, readingInches: null },
      { id: 's10', distanceFt: 10, readingInches: null },
    ];
    const calc = calculateTrackProfile({ ...BASE_PROJECT, stations });
    expect(calc.length).toBe(3);

    // Station 0 should be reference datum
    expect(calc[0].elevationInches).toBe(0);
    expect(calc[0].actionText).toBe('DATUM (REF)');
    expect(calc[0].action).toBe('ok');
    expect(calc[0].targetReadingInches).toBe(5.5);

    // Unmeasured stations should not have target in end_to_end mode until 2nd point is shot
    expect(calc[1].elevationInches).toBeNull();
    expect(calc[1].targetElevationInches).toBeNull();

    const summary = getTrackSummary(calc);
    expect(summary.totalStations).toBe(3);
    expect(summary.measuredCount).toBe(1);
    // Grade compliance requires >= 2 shots; single point is benchmark only
    expect(summary.onGradeCount).toBe(0);
  });

  it('handles single measured station in target_grade mode by projecting slope plane', () => {
    const stations: StationPoint[] = [
      { id: 's0', distanceFt: 0, readingInches: 6.0 },
      { id: 's10', distanceFt: 10, readingInches: null },
      { id: 's20', distanceFt: 20, readingInches: null },
    ];
    // Target 1.0% grade = +0.12 inches per foot
    const calc = calculateTrackProfile({
      ...BASE_PROJECT,
      gradeMode: 'target_grade',
      targetGradePercent: 1.0,
      stations,
    });

    expect(calc[0].elevationInches).toBe(0);
    expect(calc[0].targetElevationInches).toBe(0);

    // At 10 ft, 1.0% rise is 10 * 0.12" = 1.2"
    expect(calc[1].targetElevationInches).toBeCloseTo(1.2, 3);
    // Target rod reading should be 6.0 - 1.2 = 4.8"
    expect(calc[1].targetReadingInches).toBeCloseTo(4.8, 3);

    // At 20 ft, 1.0% rise is 20 * 0.12" = 2.4"
    expect(calc[2].targetElevationInches).toBeCloseTo(2.4, 3);
    expect(calc[2].targetReadingInches).toBeCloseTo(3.6, 3);
  });

  it('handles perfectly level track (identical readings across all ties)', () => {
    const stations: StationPoint[] = [
      { id: 's0', distanceFt: 0, readingInches: 5.0 },
      { id: 's5', distanceFt: 5, readingInches: 5.0 },
      { id: 's10', distanceFt: 10, readingInches: 5.0 },
      { id: 's15', distanceFt: 15, readingInches: 5.0 },
    ];
    const calc = calculateTrackProfile({ ...BASE_PROJECT, stations });

    calc.forEach(s => {
      expect(s.elevationInches).toBe(0);
      expect(s.targetElevationInches).toBe(0);
      expect(s.liftInches).toBe(0);
      expect(s.action).toBe('ok');
      expect(s.actionText).toContain('ON GRADE');
    });

    const summary = getTrackSummary(calc);
    expect(summary.onGradeCount).toBe(4);
    expect(summary.liftCount).toBe(0);
    expect(summary.lowerCount).toBe(0);
    expect(summary.maxLift).toBe(0);

    const gradeInfo = calculateGradeInfo(calc, 'end_to_end', 0);
    expect(gradeInfo?.overallGradePercent).toBe(0);
  });

  it('handles negative rod readings without numerical inversion or crash', () => {
    // In special setups or benchmark baselines, negative numbers can occur.
    // Higher rod reading = lower rail elevation (measured down from laser).
    // Reading -0.5" is 1.0" greater than -1.5", meaning rail is 1.0" lower (-1.0" elevation).
    const stations: StationPoint[] = [
      { id: 's0', distanceFt: 0, readingInches: -1.5 },
      { id: 's10', distanceFt: 10, readingInches: -0.5 },
    ];
    const calc = calculateTrackProfile({ ...BASE_PROJECT, stations });

    expect(calc[0].elevationInches).toBe(0);
    expect(calc[1].elevationInches).toBeCloseTo(-1.0, 3);
  });

  it('handles duplicate distance stations without division by zero NaN', () => {
    // Two measurements taken at the exact same distance (e.g. re-surveyed tie)
    const stations: StationPoint[] = [
      { id: 's0', distanceFt: 0, readingInches: 5.0 },
      { id: 's10a', distanceFt: 10, readingInches: 5.5 },
      { id: 's10b', distanceFt: 10, readingInches: 5.2 }, // duplicate at 10ft
      { id: 's20', distanceFt: 20, readingInches: 6.0 },
    ];
    const calc = calculateTrackProfile({ ...BASE_PROJECT, stations });

    calc.forEach(s => {
      expect(Number.isNaN(s.elevationInches)).toBe(false);
      expect(Number.isNaN(s.targetElevationInches)).toBe(false);
      expect(Number.isNaN(s.liftInches)).toBe(false);
    });
  });

  it('handles multi-chord end-to-end with multiple locked root points', () => {
    // 100 ft track: Station 0 is at 0", Station 40 is locked at -1.0" (tree root sag), Station 100 is at +1.0"
    const stations: StationPoint[] = [
      { id: 's0', distanceFt: 0, readingInches: 5.0 },       // elev = 0"
      { id: 's20', distanceFt: 20, readingInches: 5.5 },     // elev = -0.5"
      { id: 's40', distanceFt: 40, readingInches: 6.0, isLocked: true }, // elev = -1.0", LOCKED
      { id: 's70', distanceFt: 70, readingInches: 4.5 },     // elev = +0.5"
      { id: 's100', distanceFt: 100, readingInches: 4.0 },   // elev = +1.0"
    ];

    const calc = calculateTrackProfile({ ...BASE_PROJECT, gradeMode: 'end_to_end', stations });

    // Locked station must have target equal to itself and 0 lift
    const lockedStation = calc.find(s => s.id === 's40')!;
    expect(lockedStation.isLocked).toBe(true);
    expect(lockedStation.targetElevationInches).toBeCloseTo(-1.0, 3);
    expect(lockedStation.liftInches).toBe(0);
    expect(lockedStation.actionText).toContain('LOCKED');

    // Segment 1 (0 to 40 ft): slope is (-1.0 - 0) / 40 = -0.025 in/ft
    // At 20 ft, target should be 0 + 20 * (-0.025) = -0.5"
    const mid1 = calc.find(s => s.id === 's20')!;
    expect(mid1.targetElevationInches).toBeCloseTo(-0.5, 3);

    // Segment 2 (40 to 100 ft): slope is (1.0 - (-1.0)) / 60 = 2.0 / 60 = +0.0333 in/ft
    // At 70 ft (30 ft past 40), target should be -1.0 + 30 * (2/60) = 0.0"
    const mid2 = calc.find(s => s.id === 's70')!;
    expect(mid2.targetElevationInches).toBeCloseTo(0.0, 3);
  });

  it('handles daisy-chain of 3 turning points (laser relocations) with cumulative shift propagation', () => {
    const stations: StationPoint[] = [
      { id: 's0', distanceFt: 0, readingInches: 5.0 },
      { id: 's10', distanceFt: 10, readingInches: 5.0 },
      {
        id: 's20',
        distanceFt: 20,
        readingInches: 5.0,
        isTurningPoint: true,
        tpOldReadingInches: 5.0,
        tpNewReadingInches: 7.5,
        datumOffsetInches: 2.5,
      },
      { id: 's30', distanceFt: 30, readingInches: 7.5 },
      {
        id: 's40',
        distanceFt: 40,
        readingInches: 6.0,
        isTurningPoint: true,
        tpOldReadingInches: 6.0,
        tpNewReadingInches: 4.0,
        datumOffsetInches: -2.0,
      },
      { id: 's50', distanceFt: 50, readingInches: 4.0 },
    ];

    const calc = calculateTrackProfile({ ...BASE_PROJECT, stations });

    expect(calc[0].elevationInches).toBe(0);
    expect(calc[1].elevationInches).toBe(0);
    expect(calc[2].elevationInches).toBe(0);
    expect(calc[3].elevationInches).toBeCloseTo(0, 3);
    expect(calc[4].elevationInches).toBeCloseTo(1.5, 3);
    expect(calc[5].elevationInches).toBeCloseTo(1.5, 3);
  });

  it('handles extreme vertical grades (>15% incline)', () => {
    const stations: StationPoint[] = [
      { id: 's0', distanceFt: 0, readingInches: 100.0 },
      { id: 's50', distanceFt: 50, readingInches: 10.0 },
    ];
    const calc = calculateTrackProfile({ ...BASE_PROJECT, stations });
    const gradeInfo = calculateGradeInfo(calc, 'end_to_end', 0);

    expect(gradeInfo).not.toBeNull();
    expect(gradeInfo!.overallGradePercent).toBeCloseTo(15.0, 1);
    expect(calc[0].elevationInches).toBe(0);
    expect(calc[1].elevationInches).toBe(90.0);
  });
});
