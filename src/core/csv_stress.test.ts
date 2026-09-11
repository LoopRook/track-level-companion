import { describe, it, expect } from 'vitest';
import { splitCSVLine, parseTrackFromCSV, exportTrackToCSV } from './csv';
import { TrackProject } from './types';

describe('Suite 2: CSV Data Processing & Parsing Stress Tests', () => {
  it('correctly parses semicolon-delimited CSVs (European standard)', () => {
    const csvContent = [
      'Station (ft);Rod Reading;Completed;Locked;Notes',
      '0;6,28;NO;NO;Start tie',
      '5;6,15;YES;NO;Leveled',
    ].join('\n');

    const stations = parseTrackFromCSV(csvContent);
    expect(stations.length).toBe(2);
    expect(stations[0].distanceFt).toBe(0);
    expect(stations[1].distanceFt).toBe(5);
    expect(stations[1].completed).toBe(true);
  });

  it('correctly parses tab-delimited TSV data', () => {
    const tsvContent = [
      'Station\tReading\tDone\tLocked\tNotes',
      '0\t5.5\tNO\tNO\tBaseline',
      '10\t5.25\tYES\tYES\tBridge joint',
    ].join('\n');

    const stations = parseTrackFromCSV(tsvContent);
    expect(stations.length).toBe(2);
    expect(stations[0].readingInches).toBe(5.5);
    expect(stations[1].readingInches).toBe(5.25);
    expect(stations[1].isLocked).toBe(true);
  });

  it('handles quotes containing delimiters and escaped quotes per RFC 4180', () => {
    const line = '0,"1\' 4 3/8"", over road",YES,NO,"Note with, comma and ""quotes"""';
    const fields = splitCSVLine(line);
    expect(fields.length).toBe(5);
    expect(fields[0]).toBe('0');
    expect(fields[1]).toBe('1\' 4 3/8", over road');
    expect(fields[2]).toBe('YES');
    expect(fields[3]).toBe('NO');
    expect(fields[4]).toBe('Note with, comma and "quotes"');
  });

  it('correctly parses mixed measurement formats across rows', () => {
    const csv = [
      'Station,Rod Reading,Completed,Locked,Notes',
      '0,6.28,NO,NO,Decimal',
      '5,"1\' 4 3/8""",NO,NO,Feet and fraction',
      '10,16-3/8,NO,NO,Hyphen fraction',
      '15,14.375",NO,NO,Decimal with quote',
      '20,254mm,NO,NO,Metric (10 inches)',
    ].join('\n');

    const stations = parseTrackFromCSV(csv);
    expect(stations.length).toBe(5);
    expect(stations[0].readingInches).toBeCloseTo(6.28, 2);
    expect(stations[1].readingInches).toBeCloseTo(16.375, 3); // 12 + 4.375
    expect(stations[2].readingInches).toBeCloseTo(16.375, 3);
    expect(stations[3].readingInches).toBeCloseTo(14.375, 3);
    expect(stations[4].readingInches).toBeCloseTo(10.0, 1); // 254mm = 10 inches
  });

  it('ignores comments, blank rows, and trailing newlines', () => {
    const csv = [
      '# Track survey notes',
      '# Surveyed on: 2026-09-11',
      '',
      'Station (ft),Rod Reading',
      '0,5.0',
      '',
      '  ',
      '5,5.2',
      '# End of survey',
    ].join('\n');

    const stations = parseTrackFromCSV(csv);
    expect(stations.length).toBe(2);
    expect(stations[0].distanceFt).toBe(0);
    expect(stations[1].distanceFt).toBe(5);
  });

  it('maintains 100% round-trip fidelity between export and import', () => {
    const originalProject: TrackProject = {
      id: 'roundtrip-test',
      name: 'Roundtrip Test Section',
      date: '2026-09-11',
      gauge: '7 1/4"',
      unitFormat: 'decimal_inches',
      fractionResolution: 16,
      toleranceInches: 0.05,
      stationIntervalFt: 5,
      laserDatumMode: 'relative_to_first',
      gradeMode: 'end_to_end',
      targetGradePercent: 0.0,
      stations: [
        { id: 's0', distanceFt: 0, readingInches: 6.25, isLocked: true, completed: true, notes: 'Anchor zero' },
        { id: 's5', distanceFt: 5, readingInches: 6.125, isLocked: false, completed: true, notes: 'Leveled' },
        { id: 's10', distanceFt: 10, readingInches: 5.95, isLocked: false, completed: false, isTurningPoint: true, notes: 'TP Bench' },
        { id: 's15', distanceFt: 15, readingInches: null, isLocked: false, completed: false, notes: 'Unmeasured tie' },
      ],
    };

    // Export to CSV
    const csvOutput = exportTrackToCSV(originalProject);
    expect(csvOutput).toContain('Station (ft),Rod Reading');

    // Re-import
    const importedStations = parseTrackFromCSV(csvOutput);
    expect(importedStations.length).toBe(4);

    // Verify properties
    expect(importedStations[0].distanceFt).toBe(0);
    expect(importedStations[0].readingInches).toBeCloseTo(6.25, 2);
    expect(importedStations[0].isLocked).toBe(true);
    expect(importedStations[0].completed).toBe(true);
    expect(importedStations[0].notes).toBe('Anchor zero');

    expect(importedStations[1].distanceFt).toBe(5);
    expect(importedStations[1].readingInches).toBeCloseTo(6.125, 3);
    expect(importedStations[1].completed).toBe(true);
    expect(importedStations[1].notes).toBe('Leveled');

    expect(importedStations[2].distanceFt).toBe(10);
    expect(importedStations[2].readingInches).toBeCloseTo(5.95, 2);
    expect(importedStations[2].notes).toBe('TP Bench');

    expect(importedStations[3].distanceFt).toBe(15);
    expect(importedStations[3].readingInches).toBeNull();
    expect(importedStations[3].notes).toBe('Unmeasured tie');
  });

  it('handles completely corrupted input gracefully without throwing', () => {
    const corruptedInputs = [
      '',
      '   \n\n\t  ',
      'Random text with no commas or structure whatsoever',
      'Station,Reading\nINVALID,INVALID\nNaN,undefined',
      '\x00\x01\x02\x03\xFF\xFE',
    ];

    corruptedInputs.forEach(input => {
      expect(() => {
        const res = parseTrackFromCSV(input);
        expect(Array.isArray(res)).toBe(true);
      }).not.toThrow();
    });
  });
});
