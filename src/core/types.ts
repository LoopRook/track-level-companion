export type UnitFormat = 'feet_inches_fraction' | 'inches_fraction' | 'decimal_inches' | 'metric_mm';

export type GradeMode = 'target_grade' | 'end_to_end' | 'best_fit' | 'smooth_curve';

export interface StationPoint {
  id: string;
  distanceFt: number;        // Chainage along track (e.g. 0, 5, 10, 15)
  readingInches: number | null; // Raw measurement down from laser to rail head (inches)
  completed?: boolean;       // Marked as leveled/tamped trackside
  notes?: string;
  datumOffsetInches?: number; // Laser relocation offset (turning point shift)
  isTurningPoint?: boolean;   // Flag marking this station as a turning point / benchmark
  tpOldReadingInches?: number; // Laser 1 reading on this turning point tie before relocation
  tpNewReadingInches?: number; // Laser 2 reading on this turning point tie after relocation
  isLocked?: boolean;         // Immovable control point (e.g. tree root, bridge, switch)
}

export interface CalculatedStation extends StationPoint {
  effectiveReadingInches?: number | null; // readingInches - datumOffsetInches (normalized to initial laser datum)
  appliedDatumOffsetInches?: number;      // Cumulative datum offset active at this station
  elevationInches: number | null; // Relative elevation (higher = higher track)
  targetElevationInches: number | null; // Target elevation based on selected grade mode
  liftInches: number | null;     // Target - Current (positive = lift, negative = lower)
  action: 'lift' | 'lower' | 'ok' | 'none';
  actionText: string;            // e.g. "LIFT 3/8\"", "LOWER 1/8\"", "ON GRADE"
  targetReadingInches?: number | null; // The exact rod reading that corresponds to target finished elevation under active laser setup
}

export interface GradeSegment {
  startDistanceFt: number;
  endDistanceFt: number;
  lengthFt: number;
  startElevInches: number;
  endElevInches: number;
  elevChangeInches: number;
  gradePercent: number; // e.g. 0.50 for +0.50%
  slopeInchesPerFt: number;
  isLockedAnchor?: boolean;
}

export interface EndToEndGradeInfo {
  overallGradePercent: number;
  overallElevChangeInches: number;
  totalLengthFt: number;
  segments: GradeSegment[];
  hasLockedPoints: boolean;
}


export interface TrackProject {
  id: string;
  name: string;
  date: string;
  gauge: string; // e.g. "7 1/4\""
  unitFormat: UnitFormat;
  fractionResolution: 16 | 8 | 32;
  toleranceInches: number; // e.g. 0.0625 (1/16")
  stationIntervalFt: number; // default interval, e.g. 5
  laserDatumMode: 'relative_to_first' | 'fixed_datum';
  fixedDatumInches?: number; // Optional laser plane reference height
  gradeMode: GradeMode;
  targetGradePercent: number; // e.g. 0.0 for flat, 1.2 for 1.2% slope
  stations: StationPoint[];
}
