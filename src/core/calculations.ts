import type { CalculatedStation, TrackProject } from './types';
import { formatMeasurement } from './units';

/**
 * Calculates full elevation, target alignment, and lift/cut values
 * for each station point in the track project.
 */
export function calculateTrackProfile(project: TrackProject): CalculatedStation[] {
  const { stations, laserDatumMode, fixedDatumInches, gradeMode, targetGradePercent, toleranceInches, unitFormat, fractionResolution } = project;

  if (!stations || stations.length === 0) return [];

  // Step 1: Establish Laser Datum and Relative Elevations
  // Higher elevation = physical rail is higher.
  // Since reading is measured DOWN from laser plane: elevation = datum - effectiveReading.
  const validStationsWithReading = stations.filter(s => s.readingInches !== null && !isNaN(s.readingInches));

  let datumReference = 0;
  if (laserDatumMode === 'fixed_datum' && fixedDatumInches !== undefined && !isNaN(fixedDatumInches)) {
    datumReference = fixedDatumInches;
  } else if (validStationsWithReading.length > 0) {
    // Relative to first valid station (normalized by any initial offset)
    const first = validStationsWithReading[0];
    datumReference = first.readingInches! - (first.datumOffsetInches || 0);
  }

  // Calculate actual elevation for each station
  const effectiveReadings: (number | null)[] = stations.map(s => {
    if (s.readingInches === null || isNaN(s.readingInches)) return null;
    return s.readingInches - (s.datumOffsetInches || 0);
  });

  const elevations: (number | null)[] = effectiveReadings.map(eff => {
    if (eff === null) return null;
    return datumReference - eff;
  });

  // Step 2: Calculate Target Elevation Curve based on GradeMode
  const targetElevations: (number | null)[] = new Array(stations.length).fill(null);

  if (validStationsWithReading.length >= 2) {
    const validIndices = stations
      .map((s, idx) => (s.readingInches !== null && !isNaN(s.readingInches) ? idx : -1))
      .filter(idx => idx !== -1);

    if (gradeMode === 'target_grade') {
      // Rise in inches per foot of run = (grade% / 100) * 12
      const firstIdx = validIndices[0];
      const startX = stations[firstIdx].distanceFt;
      const startY = elevations[firstIdx]!;
      const slopeInchesPerFt = (targetGradePercent / 100) * 12;

      stations.forEach((s, i) => {
        targetElevations[i] = startY + (s.distanceFt - startX) * slopeInchesPerFt;
      });
    } else if (gradeMode === 'end_to_end') {
      const firstIdx = validIndices[0];
      const lastIdx = validIndices[validIndices.length - 1];

      // Identify control points: first station, any locked station (e.g. over a tree root), and last station
      const lockedIndices = validIndices.filter(idx => stations[idx].isLocked);
      const controlIndices = Array.from(new Set([firstIdx, ...lockedIndices, lastIdx]))
        .sort((a, b) => stations[a].distanceFt - stations[b].distanceFt);

      if (controlIndices.length === 1) {
        const singleY = elevations[controlIndices[0]]!;
        stations.forEach((_, i) => { targetElevations[i] = singleY; });
      } else {
        // Interpolate straight grade lines between adjacent control points
        for (let c = 0; c < controlIndices.length - 1; c++) {
          const idxA = controlIndices[c];
          const idxB = controlIndices[c + 1];
          const xA = stations[idxA].distanceFt;
          const yA = elevations[idxA]!;
          const xB = stations[idxB].distanceFt;
          const yB = elevations[idxB]!;
          const dx = xB - xA;
          const slope = dx !== 0 ? (yB - yA) / dx : 0;

          const isFirstSegment = c === 0;
          const isLastSegment = c === controlIndices.length - 2;

          stations.forEach((s, i) => {
            if (isFirstSegment && s.distanceFt <= xA) {
              targetElevations[i] = yA + (s.distanceFt - xA) * slope;
            }
            if (s.distanceFt >= xA && s.distanceFt <= xB) {
              targetElevations[i] = yA + (s.distanceFt - xA) * slope;
            }
            if (isLastSegment && s.distanceFt >= xB) {
              targetElevations[i] = yB + (s.distanceFt - xB) * slope;
            }
          });
        }
      }
    } else if (gradeMode === 'best_fit') {
      // Ordinary Least Squares regression: y = m*x + b
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumX2 = 0;
      const n = validIndices.length;

      for (const idx of validIndices) {
        const x = stations[idx].distanceFt;
        const y = elevations[idx]!;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
      }

      const denom = n * sumX2 - sumX * sumX;
      let slope = 0;
      let intercept = sumY / n;

      if (Math.abs(denom) > 1e-9) {
        slope = (n * sumXY - sumX * sumY) / denom;
        intercept = (sumY - slope * sumX) / n;
      }

      stations.forEach((s, i) => {
        targetElevations[i] = slope * s.distanceFt + intercept;
      });
    } else if (gradeMode === 'smooth_curve') {
      // 3-point Gaussian-weighted smoothing window over valid elevation points
      validIndices.forEach((idx, pos) => {
        const prev = pos > 0 ? elevations[validIndices[pos - 1]]! : elevations[idx]!;
        const curr = elevations[idx]!;
        const next = pos < validIndices.length - 1 ? elevations[validIndices[pos + 1]]! : elevations[idx]!;
        // Weighted smooth: 25% prev, 50% curr, 25% next
        targetElevations[idx] = (prev * 0.25) + (curr * 0.5) + (next * 0.25);
      });
    }
  } else if (validStationsWithReading.length === 1) {
    // With only one point, target line is just a flat or slope line anchored there
    const firstIdx = stations.findIndex(s => s.readingInches !== null && !isNaN(s.readingInches));
    const startX = stations[firstIdx].distanceFt;
    const startY = elevations[firstIdx]!;
    const slopeInchesPerFt = (targetGradePercent / 100) * 12;

    stations.forEach((s, i) => {
      targetElevations[i] = startY + (s.distanceFt - startX) * slopeInchesPerFt;
    });
  }

  // Step 3: Calculate Lifts / Cuts and Action Badges
  const tolerance = toleranceInches > 0 ? toleranceInches : 0.0625; // default 1/16"

  return stations.map((s, i) => {
    const elev = elevations[i];
    let target = targetElevations[i];

    let lift: number | null = null;
    let action: 'lift' | 'lower' | 'ok' | 'none' = 'none';
    let actionText = '—';

    if (s.isLocked && elev !== null) {
      target = elev;
      lift = 0;
      action = 'ok';
      actionText = 'LOCKED 🔒';
    } else if (elev !== null && target !== null) {
      lift = target - elev;

      if (Math.abs(lift) <= tolerance) {
        action = 'ok';
        actionText = 'ON GRADE ✓';
      } else if (lift > 0) {
        action = 'lift';
        const formattedAmt = formatMeasurement(lift, unitFormat, fractionResolution);
        actionText = `LIFT +${formattedAmt}`;
      } else {
        action = 'lower';
        const formattedAmt = formatMeasurement(Math.abs(lift), unitFormat, fractionResolution);
        actionText = `LOWER -${formattedAmt}`;
      }
    }

    return {
      ...s,
      effectiveReadingInches: effectiveReadings[i],
      elevationInches: elev,
      targetElevationInches: target,
      liftInches: lift,
      action,
      actionText,
    };
  });
}

/**
 * Computes summary statistics for the track profile
 */
export function getTrackSummary(calculatedStations: CalculatedStation[]) {
  const withLifts = calculatedStations.filter(s => s.liftInches !== null);
  if (withLifts.length === 0) {
    return {
      totalStations: calculatedStations.length,
      measuredCount: 0,
      onGradeCount: 0,
      liftCount: 0,
      lowerCount: 0,
      maxLift: 0,
      maxLower: 0,
      lengthFt: 0,
    };
  }

  const lifts = withLifts.map(s => s.liftInches!);
  const onGradeCount = withLifts.filter(s => s.action === 'ok').length;
  const liftCount = withLifts.filter(s => s.action === 'lift').length;
  const lowerCount = withLifts.filter(s => s.action === 'lower').length;

  const maxLift = Math.max(0, ...lifts);
  const maxLower = Math.abs(Math.min(0, ...lifts));

  const firstDist = calculatedStations[0]?.distanceFt ?? 0;
  const lastDist = calculatedStations[calculatedStations.length - 1]?.distanceFt ?? 0;

  return {
    totalStations: calculatedStations.length,
    measuredCount: withLifts.length,
    onGradeCount,
    liftCount,
    lowerCount,
    maxLift,
    maxLower,
    lengthFt: Math.max(0, lastDist - firstDist),
  };
}
