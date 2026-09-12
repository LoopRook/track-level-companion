import { TrackProject, StationPoint, UnitFormat, GradeMode } from './types';

export interface CompactProjectPayload {
  v: number; // schema version (e.g. 1)
  n: string; // name
  d: string; // date
  u: UnitFormat;
  fr?: 16 | 8 | 32;
  t: number; // toleranceInches
  i: number; // stationIntervalFt
  gm: GradeMode;
  gp: number; // targetGradePercent
  dm?: 'relative_to_first' | 'fixed_datum';
  fd?: number; // fixedDatumInches
  // Station tuple: [dist, reading, completed, locked, tp, offset, notes]
  // Note: reading can be null, notes can be empty
  s: Array<[number, number | null, number?, number?, number?, number?, string?]>;
}

/**
 * Encodes a Unicode string to URL-safe Base64
 */
export function toUrlSafeBase64(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decodes URL-safe Base64 back to Unicode string
 */
export function fromUrlSafeBase64(b64: string): string {
  let standardB64 = b64.replace(/-/g, '+').replace(/_/g, '/');
  while (standardB64.length % 4 !== 0) {
    standardB64 += '=';
  }
  const binary = atob(standardB64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Serializes a TrackProject into a compact, URL-safe base64 string
 */
export function serializeTrackProject(project: TrackProject): string {
  const compact: CompactProjectPayload = {
    v: 1,
    n: project.name || 'Shared Track',
    d: project.date || new Date().toISOString().split('T')[0],
    u: project.unitFormat || 'decimal_inches',
    fr: project.fractionResolution || 16,
    t: project.toleranceInches ?? 0.0625,
    i: project.stationIntervalFt || 5,
    gm: project.gradeMode || 'target_grade',
    gp: project.targetGradePercent ?? 0,
    dm: project.laserDatumMode,
    fd: project.fixedDatumInches,
    s: project.stations.map(st => {
      const tuple: [number, number | null, number?, number?, number?, number?, string?] = [
        st.distanceFt,
        st.readingInches !== null && !isNaN(st.readingInches) ? Number(st.readingInches.toFixed(4)) : null,
      ];

      const completed = st.completed ? 1 : 0;
      const locked = st.isLocked ? 1 : 0;
      const tp = st.isTurningPoint ? 1 : 0;
      const offset = st.datumOffsetInches ? Number(st.datumOffsetInches.toFixed(4)) : 0;
      const notes = st.notes || '';

      // Only push extra fields if at least one is non-default
      if (notes) {
        tuple.push(completed, locked, tp, offset, notes);
      } else if (offset !== 0) {
        tuple.push(completed, locked, tp, offset);
      } else if (tp) {
        tuple.push(completed, locked, tp);
      } else if (locked) {
        tuple.push(completed, locked);
      } else if (completed) {
        tuple.push(completed);
      }

      return tuple;
    }),
  };

  const json = JSON.stringify(compact);
  return toUrlSafeBase64(json);
}

/**
 * Deserializes a URL-safe base64 string back into a TrackProject
 */
export function deserializeTrackProject(payload: string): TrackProject | null {
  try {
    const json = fromUrlSafeBase64(payload.trim());
    const data: CompactProjectPayload = JSON.parse(json);

    if (!data || !Array.isArray(data.s)) {
      return null;
    }

    const stations: StationPoint[] = data.s.map((tuple, idx) => {
      const [dist, reading, completed, locked, tp, offset, notes] = tuple;
      return {
        id: `shared-st-${idx}-${Date.now()}`,
        distanceFt: Number(dist) || 0,
        readingInches: reading !== null && reading !== undefined ? Number(reading) : null,
        completed: Boolean(completed),
        isLocked: Boolean(locked),
        isTurningPoint: Boolean(tp),
        datumOffsetInches: offset ? Number(offset) : 0,
        notes: notes || undefined,
      };
    });

    return {
      id: `project-${Date.now()}`,
      name: data.n || 'Imported Track',
      date: data.d || new Date().toISOString().split('T')[0],
      gauge: '7 1/4"',
      unitFormat: data.u || 'decimal_inches',
      fractionResolution: data.fr || 16,
      toleranceInches: data.t ?? 0.0625,
      stationIntervalFt: data.i || 5,
      laserDatumMode: data.dm || 'relative_to_first',
      fixedDatumInches: data.fd,
      gradeMode: data.gm || 'target_grade',
      targetGradePercent: data.gp ?? 0,
      stations,
    };
  } catch {
    return null;
  }
}

/**
 * Generates the full share URL for a given project
 */
export function generateTrackShareUrl(project: TrackProject, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://looprook.github.io/track-level-companion/');
  const cleanBase = base.split('#')[0].split('?')[0];
  const payload = serializeTrackProject(project);
  return `${cleanBase}#track=${payload}`;
}

/**
 * Extracts and parses a TrackProject from a URL string, hash, or query parameter
 */
export function parseTrackFromUrl(urlOrHash: string): TrackProject | null {
  if (!urlOrHash) return null;

  let payload = '';

  // Case 1: #track=...
  const hashMatch = urlOrHash.match(/#track=([A-Za-z0-9_-]+)/);
  if (hashMatch) {
    payload = hashMatch[1];
  } else {
    // Case 2: ?track=...
    const queryMatch = urlOrHash.match(/[?&]track=([A-Za-z0-9_-]+)/);
    if (queryMatch) {
      payload = queryMatch[1];
    } else if (/^[A-Za-z0-9_-]{10,}$/.test(urlOrHash.trim())) {
      // Direct payload string
      payload = urlOrHash.trim();
    }
  }

  if (!payload) return null;
  return deserializeTrackProject(payload);
}
