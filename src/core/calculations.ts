import type { CalculatedStation, TrackProject, GradeSegment, EndToEndGradeInfo, GradeMode } from './types';
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

  const tpStations = stations.filter(s => s.isTurningPoint);
  const stationZero = validStationsWithReading.find(s => s.distanceFt === 0) || validStationsWithReading[0];

  // In the Unified Active Laser workflow, when laser is moved, all previously measured stations
  // (including Station 0) are converted by +delta to the active laser scale.
  // We detect this if Station 0 has a recorded datumOffsetInches matching a turning point.
  const isUnifiedScale = tpStations.length > 0 &&
    stationZero !== undefined &&
    stationZero.datumOffsetInches !== undefined &&
    stationZero.datumOffsetInches !== 0;

  // Dynamically compute cumulative datum offsets across turning point benchmarks
  let runningCumulativeShift = 0;
  const appliedOffsets: number[] = [];

  for (let i = 0; i < stations.length; i++) {
    const s = stations[i];
    if (isUnifiedScale) {
      // In unified active scale, all readings are already on the current active laser's scale!
      appliedOffsets.push(0);
    } else {
      if (s.isTurningPoint) {
        // Determine the step delta introduced at this turning point
        let stepDelta = 0;
        if (s.datumOffsetInches !== undefined && s.datumOffsetInches !== 0) {
          stepDelta = s.datumOffsetInches;
        } else if (s.tpNewReadingInches !== undefined && s.tpOldReadingInches !== undefined) {
          stepDelta = s.tpNewReadingInches - s.tpOldReadingInches;
        } else if (s.tpNewReadingInches !== undefined && s.readingInches !== null && !isNaN(s.readingInches)) {
          stepDelta = s.tpNewReadingInches - s.readingInches;
        }
        runningCumulativeShift += stepDelta;

        // If the turning point station's readingInches has been updated to the new Laser 2 reading,
        // it is in the new laser zone and should use runningCumulativeShift.
        // If readingInches is still the old Laser 1 reading, it uses the prior shift.
        if (s.tpOldReadingInches !== undefined && s.readingInches !== null && Math.abs(s.readingInches - s.tpOldReadingInches) > 1e-4) {
          appliedOffsets.push(runningCumulativeShift);
        } else {
          appliedOffsets.push(runningCumulativeShift - stepDelta);
        }
      } else {
        // If a turning point has been established, propagate runningCumulativeShift.
        // Otherwise, fallback to any explicitly pre-set datumOffsetInches on the station.
        const offset = runningCumulativeShift !== 0 ? runningCumulativeShift : (s.datumOffsetInches || 0);
        appliedOffsets.push(offset);
      }
    }
  }

  let datumReference = 0;
  if (laserDatumMode === 'fixed_datum' && fixedDatumInches !== undefined && !isNaN(fixedDatumInches)) {
    datumReference = fixedDatumInches;
  } else if (validStationsWithReading.length > 0) {
    // Prefer station at distance 0 ft as the primary baseline; fallback to first valid station
    const datumStation = stationZero || validStationsWithReading[0];
    const datumIdx = stations.indexOf(datumStation);
    const datumOffset = datumIdx >= 0 ? appliedOffsets[datumIdx] : (datumStation.datumOffsetInches || 0);
    datumReference = datumStation.readingInches! - datumOffset;
  }

  // Calculate actual elevation for each station
  const effectiveReadings: (number | null)[] = stations.map((s, i) => {
    if (s.readingInches === null || isNaN(s.readingInches)) return null;
    return s.readingInches - appliedOffsets[i];
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
      // Anchor target slope to Station 0 if measured, otherwise first valid station
      const stationZero = stations.find(s => s.distanceFt === 0 && s.readingInches !== null && !isNaN(s.readingInches));
      const refIdx = stationZero ? stations.indexOf(stationZero) : validIndices[0];
      const startX = stations[refIdx].distanceFt;
      const startY = elevations[refIdx]!;
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

    const activeOffset = isUnifiedScale ? (s.datumOffsetInches || 0) : appliedOffsets[i];
    let targetReading: number | null = null;

    if (s.isLocked && s.readingInches !== null) {
      targetReading = s.readingInches;
    } else if (s.readingInches !== null && lift !== null) {
      targetReading = s.readingInches - lift;
    } else if (target !== null && validStationsWithReading.length > 0) {
      targetReading = (datumReference - target) + activeOffset;
    }

    return {
      ...s,
      datumOffsetInches: isUnifiedScale ? s.datumOffsetInches : (appliedOffsets[i] !== 0 ? appliedOffsets[i] : s.datumOffsetInches),
      effectiveReadingInches: effectiveReadings[i],
      appliedDatumOffsetInches: activeOffset,
      elevationInches: elev,
      targetElevationInches: target,
      liftInches: lift,
      targetReadingInches: targetReading,
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

/**
 * Calculates grade percentages and segment slopes for End-to-End or Target Grade modes.
 * In End-to-End mode:
 * - If there are no locked points between first and last, computes overall grade percent.
 * - If there are locked points, computes the piecewise slope of each chord segment and the net end-to-end grade.
 */
export function calculateGradeInfo(
  stations: CalculatedStation[],
  gradeMode: GradeMode,
  targetGradePercent: number = 0.0
): EndToEndGradeInfo | null {
  const validStations = stations.filter(
    s => s.elevationInches !== null && !isNaN(s.elevationInches) && s.targetElevationInches !== null
  );

  if (validStations.length < 2) return null;

  if (gradeMode === 'target_grade') {
    const first = validStations[0];
    const last = validStations[validStations.length - 1];
    const totalLengthFt = Math.max(0, last.distanceFt - first.distanceFt);
    const slopeInchesPerFt = (targetGradePercent / 100) * 12;
    const elevChange = totalLengthFt * slopeInchesPerFt;

    return {
      overallGradePercent: targetGradePercent,
      overallElevChangeInches: elevChange,
      totalLengthFt,
      segments: [
        {
          startDistanceFt: first.distanceFt,
          endDistanceFt: last.distanceFt,
          lengthFt: totalLengthFt,
          startElevInches: first.targetElevationInches!,
          endElevInches: last.targetElevationInches!,
          elevChangeInches: elevChange,
          gradePercent: targetGradePercent,
          slopeInchesPerFt,
        },
      ],
      hasLockedPoints: false,
    };
  }

  // End-to-end mode
  const first = validStations[0];
  const last = validStations[validStations.length - 1];
  const totalLengthFt = last.distanceFt - first.distanceFt;
  if (totalLengthFt <= 0) return null;

  // Identify control points: first, any locked points in between, and last
  const lockedInBetween = validStations.filter(
    s => s.isLocked && s.distanceFt > first.distanceFt && s.distanceFt < last.distanceFt
  );

  const controlStations = [first, ...lockedInBetween, last].sort(
    (a, b) => a.distanceFt - b.distanceFt
  );

  // Overall net grade from first to last
  const netElevChange = last.elevationInches! - first.elevationInches!;
  const overallGradePercent = (netElevChange / (totalLengthFt * 12)) * 100;

  // Segments between control points
  const segments: GradeSegment[] = [];
  for (let i = 0; i < controlStations.length - 1; i++) {
    const sA = controlStations[i];
    const sB = controlStations[i + 1];
    const segLength = sB.distanceFt - sA.distanceFt;
    if (segLength <= 0) continue;

    const segElevChange = sB.elevationInches! - sA.elevationInches!;
    const segGradePercent = (segElevChange / (segLength * 12)) * 100;
    const slopeInchesPerFt = segElevChange / segLength;

    segments.push({
      startDistanceFt: sA.distanceFt,
      endDistanceFt: sB.distanceFt,
      lengthFt: segLength,
      startElevInches: sA.elevationInches!,
      endElevInches: sB.elevationInches!,
      elevChangeInches: segElevChange,
      gradePercent: segGradePercent,
      slopeInchesPerFt,
      isLockedAnchor: sA.isLocked || sB.isLocked,
    });
  }

  return {
    overallGradePercent,
    overallElevChangeInches: netElevChange,
    totalLengthFt,
    segments,
    hasLockedPoints: lockedInBetween.length > 0,
  };
}

