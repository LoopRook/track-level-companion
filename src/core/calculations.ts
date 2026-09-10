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
    const firstIdx = stations.findIndex(s => s.readingInches !== null && !isNaN(s.readingInches));
    if (firstIdx >= 0) {
      if (gradeMode === 'target_grade') {
        // In Target Grade mode, a single shot establishes the reference datum,
        // allowing the target slope plane to project across all stations from that point
        const startX = stations[firstIdx].distanceFt;
        const startY = elevations[firstIdx]!;
        const slopeInchesPerFt = (targetGradePercent / 100) * 12;

        stations.forEach((s, i) => {
          targetElevations[i] = startY + (s.distanceFt - startX) * slopeInchesPerFt;
        });
      } else {
        // In End-to-End or regression modes, you cannot project a target line with only 1 point.
        // Target line remains null for unmeasured stations until the other end is surveyed.
        targetElevations[firstIdx] = elevations[firstIdx];
      }
    }
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

      if (validStationsWithReading.length === 1) {
        // A single lone measurement acts as the reference datum, not an already leveled tie
        action = 'ok';
        actionText = 'DATUM (REF)';
      } else if (Math.abs(lift) <= tolerance) {
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
  const completedCount = calculatedStations.filter(s => !!s.completed).length;
  const withLifts = calculatedStations.filter(s => s.liftInches !== null);
  if (withLifts.length === 0) {
    return {
      totalStations: calculatedStations.length,
      measuredCount: 0,
      completedCount,
      onGradeCount: 0,
      liftCount: 0,
      lowerCount: 0,
      maxLift: 0,
      maxLower: 0,
      lengthFt: 0,
    };
  }

  const lifts = withLifts.map(s => s.liftInches!);
  // When only 1 station is measured, it is the benchmark datum; grade compliance requires >= 2 shots
  const onGradeCount = withLifts.length >= 2 ? withLifts.filter(s => s.action === 'ok').length : 0;
  const liftCount = withLifts.length >= 2 ? withLifts.filter(s => s.action === 'lift').length : 0;
  const lowerCount = withLifts.length >= 2 ? withLifts.filter(s => s.action === 'lower').length : 0;

  const maxLift = Math.max(0, ...lifts);
  const maxLower = Math.abs(Math.min(0, ...lifts));

  const firstDist = calculatedStations[0]?.distanceFt ?? 0;
  const lastDist = calculatedStations[calculatedStations.length - 1]?.distanceFt ?? 0;

  return {
    totalStations: calculatedStations.length,
    measuredCount: withLifts.length,
    completedCount,
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

export interface SubsetGradeInfo {
  startStation: CalculatedStation;
  endStation: CalculatedStation;
  distanceFt: number;
  elevationDiffInches: number;
  netGradePercent: number;
  stationCount: number;
  stationsInRange: CalculatedStation[];
  bestFitGradePercent: number | null;
  maxDeviationInches: number | null;
  slopeInchesPerFt: number;
  direction: 'uphill' | 'downhill' | 'flat';
}

/**
 * Calculates grade slope, elevation rise/fall, chord line, and statistical variations
 * between any two arbitrary stations along the track.
 */
export function calculateSubsetGrade(
  stations: CalculatedStation[],
  stationIdA: string,
  stationIdB: string
): SubsetGradeInfo | null {
  const stationA = stations.find(s => s.id === stationIdA);
  const stationB = stations.find(s => s.id === stationIdB);

  if (!stationA || !stationB || stationA.id === stationB.id) return null;
  if (stationA.elevationInches === null || stationB.elevationInches === null) return null;

  // Order by distance
  const [start, end] = stationA.distanceFt <= stationB.distanceFt ? [stationA, stationB] : [stationB, stationA];
  const distanceFt = end.distanceFt - start.distanceFt;
  if (distanceFt <= 0) return null;

  const elevationDiffInches = end.elevationInches! - start.elevationInches!;
  const netGradePercent = (elevationDiffInches / (distanceFt * 12)) * 100;
  const slopeInchesPerFt = elevationDiffInches / distanceFt;

  const stationsInRange = stations.filter(
    s => s.distanceFt >= start.distanceFt && s.distanceFt <= end.distanceFt
  );

  const measuredInRange = stationsInRange.filter(s => s.elevationInches !== null);

  // Best fit linear regression if 3 or more measured stations
  let bestFitGradePercent: number | null = null;
  let maxDeviationInches: number | null = null;

  if (measuredInRange.length >= 3) {
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    const n = measuredInRange.length;

    for (const st of measuredInRange) {
      const x = st.distanceFt;
      const y = st.elevationInches!;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }

    const denominator = n * sumX2 - sumX * sumX;
    if (Math.abs(denominator) > 1e-9) {
      const slope = (n * sumXY - sumX * sumY) / denominator; // inches per ft
      bestFitGradePercent = (slope / 12) * 100;
    }

    // Max absolute deviation from the straight chord between start and end
    let maxDev = 0;
    for (const st of measuredInRange) {
      const chordY = start.elevationInches! + (st.distanceFt - start.distanceFt) * slopeInchesPerFt;
      const dev = Math.abs(st.elevationInches! - chordY);
      if (dev > maxDev) maxDev = dev;
    }
    maxDeviationInches = maxDev;
  }

  const direction: 'uphill' | 'downhill' | 'flat' =
    netGradePercent > 0.005 ? 'uphill' : netGradePercent < -0.005 ? 'downhill' : 'flat';

  return {
    startStation: start,
    endStation: end,
    distanceFt,
    elevationDiffInches,
    netGradePercent,
    stationCount: stationsInRange.length,
    stationsInRange,
    bestFitGradePercent,
    maxDeviationInches,
    slopeInchesPerFt,
    direction,
  };
}

