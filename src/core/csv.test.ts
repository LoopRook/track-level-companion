import { describe, it, expect } from 'vitest';
import { exportTrackToCSV, parseTrackFromCSV, appendStations } from './csv';
import { TrackProject, StationPoint } from './types';

describe('CSV Import, Export & Combine Operations', () => {
  const sampleProject: TrackProject = {
    id: 'proj-1',
    name: 'Main Line Section A',
    date: '2026-09-08',
    gauge: '7 1/4"',
    unitFormat: 'feet_inches_fraction',
    fractionResolution: 16,
    toleranceInches: 0.0625,
    stationIntervalFt: 5,
    laserDatumMode: 'relative_to_first',
    gradeMode: 'target_grade',
    targetGradePercent: 0.0,
    stations: [
      { id: '1', distanceFt: 0, readingInches: 14.0, completed: true },
      { id: '2', distanceFt: 5, readingInches: 14.25, completed: false, isLocked: true, notes: 'Over oak root' },
      { id: '3', distanceFt: 10, readingInches: 16.5, completed: true, datumOffsetInches: 2.25, isTurningPoint: true, notes: 'Laser moved' },
    ],
  };

  it('exports track to well-formed CSV with readings, datum offset, and locked flags', () => {
    const csv = exportTrackToCSV(sampleProject);
    const lines = csv.trim().split('\n');

    expect(lines[0]).toBe('Station (ft),Laser Reading (in),Laser Reading (ft/in),Completed,Datum Offset (in),Locked,Notes');
    expect(lines.length).toBe(4); // header + 3 stations

    // Station 0
    expect(lines[1]).toContain('0,14.0000,"1\' 2""",YES,,NO');
    // Station 5 (locked over root)
    expect(lines[2]).toContain('5,14.2500,"1\' 2 1/4""",NO,,YES,Over oak root');
    // Station 10 (turning point with datum offset 2.25)
    expect(lines[3]).toContain('10,16.5000,"1\' 4 1/2""",YES,2.2500,NO,Laser moved');
  });

  it('parses CSV back into StationPoint array preserving all values and flags', () => {
    const csv = exportTrackToCSV(sampleProject);
    const parsed = parseTrackFromCSV(csv);

    expect(parsed.length).toBe(3);

    expect(parsed[0].distanceFt).toBe(0);
    expect(parsed[0].readingInches).toBeCloseTo(14.0, 4);
    expect(parsed[0].completed).toBe(true);
    expect(parsed[0].isLocked).toBe(false);

    expect(parsed[1].distanceFt).toBe(5);
    expect(parsed[1].readingInches).toBeCloseTo(14.25, 4);
    expect(parsed[1].completed).toBe(false);
    expect(parsed[1].isLocked).toBe(true);
    expect(parsed[1].notes).toBe('Over oak root');

    expect(parsed[2].distanceFt).toBe(10);
    expect(parsed[2].readingInches).toBeCloseTo(16.5, 4);
    expect(parsed[2].datumOffsetInches).toBeCloseTo(2.25, 4);
    expect(parsed[2].isTurningPoint).toBe(true);
    expect(parsed[2].notes).toBe('Laser moved');
  });

  it('is backward compatible with legacy 5-column and 6-column CSV files', () => {
    const legacy5Col = `Station (ft),Laser Reading (in),Laser Reading (ft/in),Completed,Notes
0,12.0000,"1' 0",YES,Start
5,12.5000,"1' 0 1/2",NO,Dip`;

    const parsed5 = parseTrackFromCSV(legacy5Col);
    expect(parsed5.length).toBe(2);
    expect(parsed5[0].distanceFt).toBe(0);
    expect(parsed5[0].readingInches).toBeCloseTo(12.0, 4);
    expect(parsed5[0].completed).toBe(true);
    expect(parsed5[0].notes).toBe('Start');
    expect(parsed5[1].distanceFt).toBe(5);
    expect(parsed5[1].readingInches).toBeCloseTo(12.5, 4);
    expect(parsed5[1].completed).toBe(false);
    expect(parsed5[1].notes).toBe('Dip');

    const legacy6Col = `Station (ft),Laser Reading (in),Laser Reading (ft/in),Completed,Datum Offset (in),Notes
0,14.0,1' 2,YES,,Joint
50,16.5,1' 4 1/2,YES,2.5,Tripod 2`;

    const parsed6 = parseTrackFromCSV(legacy6Col);
    expect(parsed6.length).toBe(2);
    expect(parsed6[1].distanceFt).toBe(50);
    expect(parsed6[1].datumOffsetInches).toBeCloseTo(2.5, 4);
    expect(parsed6[1].isTurningPoint).toBe(true);
  });

  it('correctly appends and combines two track segments shifting distance chains', () => {
    const section1: StationPoint[] = [
      { id: 's1-0', distanceFt: 0, readingInches: 14.0 },
      { id: 's1-25', distanceFt: 25, readingInches: 14.25 },
      { id: 's1-50', distanceFt: 50, readingInches: 14.0 }, // ends at 50ft
    ];

    const section2: StationPoint[] = [
      { id: 's2-0', distanceFt: 0, readingInches: 14.0 },   // joint tie at 0ft
      { id: 's2-25', distanceFt: 25, readingInches: 13.75 },
      { id: 's2-50', distanceFt: 50, readingInches: 14.0 },
    ];

    // Combine with distance shift
    const combined = appendStations(section1, section2, true);

    // Should avoid duplicate joint station (0ft dropped because 50ft already exists)
    // Results should be 0ft, 25ft, 50ft, 75ft, 100ft!
    expect(combined.length).toBe(5);
    expect(combined.map(s => s.distanceFt)).toEqual([0, 25, 50, 75, 100]);
    expect(combined[3].readingInches).toBeCloseTo(13.75, 4);
    expect(combined[4].readingInches).toBeCloseTo(14.0, 4);
  });

  it('parses feet/inches fractions directly from CSV readings', () => {
    const fractionalCSV = `Station,Reading (ft/in),Notes
0,"1' 4 3/8""",Start tie
5,"1' 2 1/4""",Dip tie
10,"14 1/2""",Half inch tie`;

    const parsed = parseTrackFromCSV(fractionalCSV);
    expect(parsed.length).toBe(3);
    expect(parsed[0].readingInches).toBeCloseTo(16.375, 4);
    expect(parsed[1].readingInches).toBeCloseTo(14.25, 4);
    expect(parsed[2].readingInches).toBeCloseTo(14.5, 4);
  });

  it('parses tab-delimited (TSV) pasted from Google Sheets or Excel', () => {
    const tsv = `Station\tLaser Reading\tNotes\n0\t14.25\tStart\n5\t14.5\tDip`;
    const parsed = parseTrackFromCSV(tsv);
    expect(parsed.length).toBe(2);
    expect(parsed[0].distanceFt).toBe(0);
    expect(parsed[0].readingInches).toBeCloseTo(14.25, 4);
    expect(parsed[1].distanceFt).toBe(5);
    expect(parsed[1].readingInches).toBeCloseTo(14.5, 4);
  });

  it('parses headerless CSV data rows directly', () => {
    const rawData = `0, 14.0, "1' 2", YES\n5, 14.25, "1' 2 1/4", NO`;
    const parsed = parseTrackFromCSV(rawData);
    expect(parsed.length).toBe(2);
    expect(parsed[0].distanceFt).toBe(0);
    expect(parsed[0].readingInches).toBeCloseTo(14.0, 4);
    expect(parsed[1].distanceFt).toBe(5);
    expect(parsed[1].readingInches).toBeCloseTo(14.25, 4);
  });
});
