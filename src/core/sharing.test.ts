import { describe, it, expect } from 'vitest';
import {
  serializeTrackProject,
  deserializeTrackProject,
  generateTrackShareUrl,
  parseTrackFromUrl,
} from './sharing';
import { TrackProject } from './types';

describe('Track Sharing & URL Serialization', () => {
  const sampleProject: TrackProject = {
    id: 'test-project-1',
    name: 'Steep Woods Branch #2',
    date: '2026-09-11',
    gauge: '7 1/4"',
    unitFormat: 'decimal_inches',
    fractionResolution: 16,
    toleranceInches: 0.0625,
    stationIntervalFt: 5,
    laserDatumMode: 'relative_to_first',
    gradeMode: 'target_grade',
    targetGradePercent: 1.25,
    stations: [
      { id: 's1', distanceFt: 0, readingInches: 6.25, completed: true, notes: 'Oak Tree Start' },
      { id: 's2', distanceFt: 5, readingInches: 6.1875, completed: false },
      { id: 's3', distanceFt: 10, readingInches: 6.125, isLocked: true },
      { id: 's4', distanceFt: 15, readingInches: 6.0625, isTurningPoint: true, datumOffsetInches: 2.5 },
      { id: 's5', distanceFt: 20, readingInches: null },
    ],
  };

  it('serializes and deserializes accurately with roundtrip fidelity', () => {
    const encoded = serializeTrackProject(sampleProject);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(20);

    const decoded = deserializeTrackProject(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.name).toBe(sampleProject.name);
    expect(decoded?.date).toBe(sampleProject.date);
    expect(decoded?.unitFormat).toBe(sampleProject.unitFormat);
    expect(decoded?.toleranceInches).toBe(sampleProject.toleranceInches);
    expect(decoded?.targetGradePercent).toBe(sampleProject.targetGradePercent);
    expect(decoded?.stations.length).toBe(sampleProject.stations.length);

    // Verify individual stations
    expect(decoded?.stations[0].distanceFt).toBe(0);
    expect(decoded?.stations[0].readingInches).toBe(6.25);
    expect(decoded?.stations[0].completed).toBe(true);
    expect(decoded?.stations[0].notes).toBe('Oak Tree Start');

    expect(decoded?.stations[2].distanceFt).toBe(10);
    expect(decoded?.stations[2].isLocked).toBe(true);

    expect(decoded?.stations[3].distanceFt).toBe(15);
    expect(decoded?.stations[3].isTurningPoint).toBe(true);
    expect(decoded?.stations[3].datumOffsetInches).toBe(2.5);

    expect(decoded?.stations[4].distanceFt).toBe(20);
    expect(decoded?.stations[4].readingInches).toBeNull();
  });

  it('generates a full share URL containing the #track= hash', () => {
    const url = generateTrackShareUrl(sampleProject, 'https://looprook.github.io/track-level-companion/');
    expect(url).toContain('https://looprook.github.io/track-level-companion/#track=');
    expect(url).not.toContain('undefined');
  });

  it('parses track accurately from #track= hash', () => {
    const url = generateTrackShareUrl(sampleProject, 'https://example.com/app/#dummy');
    const parsed = parseTrackFromUrl(url);
    expect(parsed).not.toBeNull();
    expect(parsed?.name).toBe(sampleProject.name);
    expect(parsed?.stations.length).toBe(sampleProject.stations.length);
  });

  it('parses track from ?track= search query param', () => {
    const encoded = serializeTrackProject(sampleProject);
    const url = `https://example.com/app/?track=${encoded}`;
    const parsed = parseTrackFromUrl(url);
    expect(parsed).not.toBeNull();
    expect(parsed?.name).toBe(sampleProject.name);
  });

  it('handles invalid or corrupted payloads gracefully', () => {
    expect(parseTrackFromUrl('invalid-data-nonsense')).toBeNull();
    expect(parseTrackFromUrl('https://example.com/#track=invalid!@#$%^')).toBeNull();
    expect(parseTrackFromUrl('')).toBeNull();
  });
});
