import { TrackProject, StationPoint } from './types';
import { formatFeetInches } from './units';

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

/**
 * Splits a CSV line following RFC 4180 rules (handles escaped double-quotes).
 */
export function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 2;
        continue;
      } else {
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }
    if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      i++;
      continue;
    }
    current += char;
    i++;
  }
  result.push(current.trim());
  return result;
}

/**
 * Generates a standard CSV string representing the track profile.
 */
export function exportTrackToCSV(project: TrackProject): string {
  const headers = [
    'Station (ft)',
    'Laser Reading (in)',
    'Laser Reading (ft/in)',
    'Completed',
    'Datum Offset (in)',
    'Locked',
    'Notes',
  ];

  const rows = project.stations.map(s => [
    s.distanceFt.toString(),
    s.readingInches !== null && !isNaN(s.readingInches) ? s.readingInches.toFixed(4) : '',
    s.readingInches !== null && !isNaN(s.readingInches) ? escapeCSV(formatFeetInches(s.readingInches)) : '',
    s.completed ? 'YES' : 'NO',
    s.datumOffsetInches !== undefined && s.datumOffsetInches !== 0 ? s.datumOffsetInches.toFixed(4) : '',
    s.isLocked ? 'YES' : 'NO',
    s.notes ? escapeCSV(s.notes) : '',
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Parses track stations from CSV text.
 * Backwards compatible with legacy 5-column and 6-column formats.
 */
export function parseTrackFromCSV(csvText: string): StationPoint[] {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  const stations: StationPoint[] = [];

  let prevDatumOffset: number | undefined = undefined;

  for (let i = 1; i < lines.length; i++) {
    const parts = splitCSVLine(lines[i]);

    const dist = parseFloat(parts[0]);
    if (isNaN(dist)) continue;

    const rawReading = parts[1] ? parseFloat(parts[1]) : null;
    const reading = rawReading !== null && !isNaN(rawReading) ? rawReading : null;
    const completed = parts[3]?.toUpperCase() === 'YES';

    let datumOffset: number | undefined = undefined;
    let isLocked = false;
    let notes = '';

    if (parts.length >= 7) {
      // Modern 7-column: Dist, ReadingIn, ReadingFtIn, Completed, DatumOffset, Locked, Notes
      const parsedOffset = parseFloat(parts[4]);
      if (!isNaN(parsedOffset) && parsedOffset !== 0) datumOffset = parsedOffset;
      isLocked = parts[5]?.toUpperCase() === 'YES';
      notes = parts[6] || '';
    } else if (parts.length === 6) {
      // 6-column: Dist, ReadingIn, ReadingFtIn, Completed, DatumOffset, Notes
      const parsedOffset = parseFloat(parts[4]);
      if (!isNaN(parsedOffset) && parsedOffset !== 0) datumOffset = parsedOffset;
      notes = parts[5] || '';
    } else if (parts.length >= 5) {
      // 5-column legacy: Dist, ReadingIn, ReadingFtIn, Completed, Notes
      notes = parts[4] || '';
    }

    const isTurningPoint = datumOffset !== undefined && datumOffset !== 0 && datumOffset !== prevDatumOffset;
    prevDatumOffset = datumOffset;

    stations.push({
      id: `station-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      distanceFt: dist,
      readingInches: reading,
      completed,
      datumOffsetInches: datumOffset,
      isTurningPoint,
      isLocked,
      notes,
    });
  }

  return stations;
}

/**
 * Appends incoming stations to existing stations.
 * If shiftDistances is true, shifts incoming distances so that they continue seamlessly
 * after the existing track's last station.
 */
export function appendStations(
  currentStations: StationPoint[],
  incomingStations: StationPoint[],
  shiftDistances: boolean
): StationPoint[] {
  if (incomingStations.length === 0) return [...currentStations];
  if (currentStations.length === 0) return [...incomingStations];

  const lastDist = currentStations[currentStations.length - 1].distanceFt;

  let processedIncoming: StationPoint[];

  if (shiftDistances) {
    const firstIncomingDist = incomingStations[0].distanceFt;
    // If incoming starts at 0 and current already has a reading at lastDist,
    // avoid duplicate tie at joint
    const hasExistingLastReading = currentStations[currentStations.length - 1].readingInches !== null;

    const filtered = incomingStations.filter(s => {
      if (firstIncomingDist === 0 && s.distanceFt === 0 && hasExistingLastReading) {
        return false;
      }
      return true;
    });

    processedIncoming = filtered.map((s, idx) => ({
      ...s,
      id: `station-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      distanceFt: s.distanceFt + lastDist,
    }));
  } else {
    processedIncoming = incomingStations.map((s, idx) => ({
      ...s,
      id: `station-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    }));
  }

  return [...currentStations, ...processedIncoming];
}
