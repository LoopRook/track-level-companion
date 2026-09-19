import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { SettingsModal } from './SettingsModal';
import { TrackProject } from '../core/types';

const mockProject: TrackProject = {
  id: 'test-1',
  name: 'Test Subdivision',
  date: '2026-09-18',
  gauge: '7 1/2"',
  targetGradePercent: 0,
  stations: [
    { id: 'st-0', distanceFt: 0, readingInches: 10 },
    { id: 'st-5', distanceFt: 5, readingInches: 10.25 },
  ],
  toleranceInches: 0.0625,
  unitFormat: 'inches_fraction',
  fractionResolution: 16,
  stationIntervalFt: 5,
  laserDatumMode: 'relative_to_first',
  gradeMode: 'target_grade',
};

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, val: string) => { store[key] = String(val); },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('SettingsModal Component', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('renders Nothing OS production theme by default with Developer Options hidden', () => {
    const html = renderToString(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        project={mockProject}
        onChangeProject={vi.fn()}
        prototypeStyle="nothing"
        isDarkMode={true}
      />
    );

    expect(html).toContain('LEVELING &amp; APP SETTINGS');
    expect(html).toContain('Nothing OS');
    expect(html).toContain('Production Active');
    expect(html).toContain('[ Close ]');
    // Developer section should be hidden by default
    expect(html).not.toContain('Developer &amp; Experimental Options');
    expect(html).not.toContain('Archived Prototype Styles');
  });

  it('renders Developer Options when tlc_dev_mode_unlocked is true in localStorage', () => {
    try {
      localStorage.setItem('tlc_dev_mode_unlocked', 'true');
    } catch {}

    const html = renderToString(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        project={mockProject}
        onChangeProject={vi.fn()}
        prototypeStyle="nothing"
        isDarkMode={true}
      />
    );

    expect(html).toContain('Developer &amp; Experimental Options');
    expect(html).toContain('Archived Prototype Styles');
    expect(html).toContain('Liquid Glass (Archived)');
    expect(html).toContain('Lock &amp; Hide');
  });

  it('renders nothing when closed', () => {
    const html = renderToString(
      <SettingsModal
        isOpen={false}
        onClose={vi.fn()}
        project={mockProject}
        onChangeProject={vi.fn()}
      />
    );

    expect(html).toBe('');
  });
});
