import { TrackProject, StationPoint } from './types';
import { formatFeetInches, parseMeasurement } from './units';

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\t') || val.includes(';')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

/**
 * Splits a CSV/TSV line following RFC 4180 rules (handles escaped double-quotes and auto-detects delimiter).
 */
export function splitCSVLine(line: string, delimiter?: string): string[] {
  const delim = delimiter || (line.includes('\t') ? '\t' : (line.includes(';') && !line.includes(',') ? ';' : ','));
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let fieldStarted = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (!fieldStarted) {
      if (char === ' ' || char === '\t') {
        if (char !== delim) {
          i++;
          continue;
        }
      }
      if (char === '"') {
        inQuotes = true;
        fieldStarted = true;
        i++;
        continue;
      }
      fieldStarted = true;
    }

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      }
      current += char;
      i++;
      continue;
    }

    if (char === delim) {
      result.push(current.trim());
      current = '';
      fieldStarted = false;
      inQuotes = false;
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
 * Generates a clean, standard CSV template that users can download or copy to Google Drive / Sheets.
 */
export function generateCSVTemplate(lengthFt: number = 50, intervalFt: number = 5): string {
  const headers = ['Station (ft)', 'Laser Reading', 'Completed', 'Locked', 'Notes'];
  const rows: string[] = [];

  for (let dist = 0; dist <= lengthFt; dist += intervalFt) {
    if (dist === 0) {
      rows.push([dist, escapeCSV("1' 2 1/4\""), 'NO', 'NO', escapeCSV('Station 0 baseline reading')].join(','));
    } else if (dist === 20) {
      rows.push([dist, escapeCSV("1' 2 1/2\""), 'NO', 'NO', escapeCSV('Example reading (edit or delete)')].join(','));
    } else {
      rows.push([dist, '', 'NO', 'NO', ''].join(','));
    }
  }

  return [
    '# Track Level Companion - Standard Field Data Template',
    '# Open in Google Sheets or Excel. Fill in Laser Readings, then re-upload.',
    '# Accepted reading formats: 1\' 4 3/8", 16 3/8", 14.375, or 365mm',
    headers.join(','),
    ...rows,
  ].join('\n');
}

/**
 * Generates a tab-separated (TSV) clipboard-ready format for instant paste into Google Sheets.
 */
export function generateGoogleSheetsTSVTemplate(lengthFt: number = 50, intervalFt: number = 5): string {
  const headers = ['Station (ft)', 'Laser Reading', 'Completed', 'Locked', 'Notes'];
  const rows: string[] = [];

  for (let dist = 0; dist <= lengthFt; dist += intervalFt) {
    if (dist === 0) {
      rows.push([dist, "1' 2 1/4\"", 'NO', 'NO', 'Station 0 baseline reading'].join('\t'));
    } else {
      rows.push([dist, '', 'NO', 'NO', ''].join('\t'));
    }
  }

  return [headers.join('\t'), ...rows].join('\n');
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
 * Highly robust: handles dynamic column orders, decimal/fraction formats, and headerless data.
 */
export function parseTrackFromCSV(csvText: string): StationPoint[] {
  if (!csvText || typeof csvText !== 'string') return [];
  const lines = csvText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'));
  if (lines.length === 0) return [];

  const stations: StationPoint[] = [];

  // Determine delimiter from first non-empty line
  const sampleLine = lines[0];
  const delim = sampleLine.includes('\t') ? '\t' : (sampleLine.includes(';') && !sampleLine.includes(',') ? ';' : ',');

  const firstParts = splitCSVLine(lines[0], delim);
  // Check if first line is a header row (first element is non-numeric)
  const firstIsHeader = isNaN(parseFloat(firstParts[0]));

  let distIdx = 0;
  let readingInIdx = 1;
  let readingFtInIdx = 2;
  let completedIdx = 3;
  let offsetIdx = 4;
  let lockedIdx = 5;
  let notesIdx = 6;

  let startIndex = 0;

  if (firstIsHeader) {
    startIndex = 1;
    distIdx = -1;
    readingInIdx = -1;
    readingFtInIdx = -1;
    completedIdx = -1;
    offsetIdx = -1;
    lockedIdx = -1;
    notesIdx = -1;

    firstParts.forEach((header, idx) => {
      const h = header.toLowerCase();
      if (h.includes('datum') || h.includes('offset') || h.includes('shift')) {
        offsetIdx = idx;
      } else if (h.includes('station') || h.includes('dist') || h.includes('chainage') || h === 'ft' || h === 'feet' || h === 'distance (ft)') {
        distIdx = idx;
      } else if (h.includes('(ft/in)') || h.includes('ft/in') || h.includes('fraction') || h.includes('feet/in')) {
        readingFtInIdx = idx;
      } else if (h.includes('reading (in)') || h.includes('laser (in)') || (h.includes('reading') && h.includes('(in)')) || h.includes('decimal')) {
        readingInIdx = idx;
      } else if (h.includes('reading') || h.includes('laser') || h.includes('rod')) {
        readingInIdx = idx;
      } else if (h.includes('complete') || h.includes('done') || h.includes('status')) {
        completedIdx = idx;
      } else if (h.includes('lock') || h.includes('root') || h.includes('fixed')) {
        lockedIdx = idx;
      } else if (h.includes('note') || h.includes('comment')) {
        notesIdx = idx;
      }
    });

    if (distIdx === -1) distIdx = 0;
    if (readingInIdx === -1 && readingFtInIdx === -1) readingInIdx = 1;
  }

  let prevDatumOffset: number | undefined = undefined;

  for (let i = startIndex; i < lines.length; i++) {
    const parts = splitCSVLine(lines[i], delim);
    if (parts.length === 0) continue;

    const rawDist = distIdx >= 0 ? parts[distIdx] : undefined;
    if (rawDist === undefined || rawDist === '') continue;
    const dist = parseFloat(rawDist);
    if (isNaN(dist)) continue;

    // Robust measurement parsing: check readingInIdx first, then readingFtInIdx
    let reading: number | null = null;
    const readingInStr = readingInIdx >= 0 ? parts[readingInIdx] : undefined;
    const readingFtInStr = readingFtInIdx >= 0 ? parts[readingFtInIdx] : undefined;

    if (readingInStr && readingInStr.trim() !== '') {
      const parsed = parseMeasurement(readingInStr);
      if (parsed !== null && !isNaN(parsed)) reading = parsed;
    }
    if (reading === null && readingFtInStr && readingFtInStr.trim() !== '') {
      const parsed = parseMeasurement(readingFtInStr);
      if (parsed !== null && !isNaN(parsed)) reading = parsed;
    }

    const completedStr = completedIdx >= 0 ? parts[completedIdx]?.toUpperCase() : undefined;
    const completed = completedStr === 'YES' || completedStr === 'TRUE' || completedStr === '1';

    let datumOffset: number | undefined = undefined;
    if (offsetIdx >= 0 && parts[offsetIdx] && parts[offsetIdx].trim() !== '') {
      const parsedOffset = parseFloat(parts[offsetIdx]);
      if (!isNaN(parsedOffset) && parsedOffset !== 0) datumOffset = parsedOffset;
    }

    const lockedStr = lockedIdx >= 0 ? parts[lockedIdx]?.toUpperCase() : undefined;
    const isLocked = lockedStr === 'YES' || lockedStr === 'TRUE' || lockedStr === '1';

    const notes = notesIdx >= 0 ? (parts[notesIdx] || '') : '';

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
 * Appends incoming stations to existing stations with distance shift and joint-tie handling.
 * 
 * NOTE: This function is preserved for future multi-crew/multi-file section merging.
 * It is currently deactivated from the user-facing UI because Track Level Companion is designed
 * for single-operator field use, where extending a track (both forward and before 0) is done
 * directly on the live screen using the "Extend" buttons under the active laser setup.
 * 
 * Boundary considerations:
 * - Joint tie: If Section A ends at 50 ft and Section B starts at 0 ft, Section B's 0 ft
 *   station is merged into Section A's 50 ft station, and subsequent ties start at 55 ft.
 * - Stations before 0: If merging sections with negative stationing (e.g. feathering),
 *   the coordinate shift must account for negative origin offsets.
 * 
 * See `docs/MERGE_FEATURE.md` for full architectural documentation.
 * 
 * @param currentStations Existing track stations
 * @param incomingStations Stations from CSV or saved profile to append
 * @param shiftDistances If true, offsets incoming distanceFt by currentStations[last].distanceFt
 */
export function appendStations(
  currentStations: StationPoint[],
  incomingStations: StationPoint[],
  shiftDistances: boolean
): StationPoint[] {
  if (incomingStations.length === 0) return [...currentStations];
  if (currentStations.length === 0) return [...incomingStations];

  const lastDist = currentStations[currentStations.length - 1].distanceFt;
  const lastStation = currentStations[currentStations.length - 1];

  let baseStations = [...currentStations];
  let incomingToProcess = incomingStations;

  if (shiftDistances) {
    const firstIncoming = incomingStations[0];
    if (firstIncoming.distanceFt === 0) {
      if (lastStation.readingInches === null && firstIncoming.readingInches !== null) {
        baseStations[baseStations.length - 1] = {
          ...lastStation,
          readingInches: firstIncoming.readingInches,
          completed: firstIncoming.completed ?? lastStation.completed,
          notes: firstIncoming.notes || lastStation.notes,
        };
      }
      incomingToProcess = incomingStations.slice(1);
    }

    const shiftedIncoming = incomingToProcess.map((s, idx) => ({
      ...s,
      id: `station-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      distanceFt: s.distanceFt + lastDist,
    }));

    return [...baseStations, ...shiftedIncoming];
  } else {
    const processedIncoming = incomingStations.map((s, idx) => ({
      ...s,
      id: `station-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    }));
    return [...currentStations, ...processedIncoming];
  }
}
