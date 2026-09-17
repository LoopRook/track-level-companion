import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { PrototypeLabBar, STYLES_META } from './PrototypeLabBar';
import App from '../App';

describe('2026 Prototype Lab', () => {
  it('defines metadata for all curated prototype styles plus original', () => {
    const styleIds = STYLES_META.map(s => s.id);
    expect(styleIds).toContain('glass');
    expect(styleIds).toContain('swiss');
    expect(styleIds).toContain('claymorphism');
    expect(styleIds).toContain('nothing');
    expect(styleIds).toContain('cockpit');
    expect(styleIds).toContain('original');
  });

  it('renders all style selector buttons and color mode toggles', () => {
    const html = renderToString(
      <PrototypeLabBar
        activeStyle="nothing"
        onChangeStyle={vi.fn()}
        colorMode="dark"
        onChangeColorMode={vi.fn()}
      />
    );

    expect(html).toContain('2026 Prototype Lab');
    expect(html).toContain('Nothing OS');
    expect(html).toContain('Liquid Glass');
    expect(html).toContain('Swiss Typographic');
    expect(html).toContain('Tactile Claymorphism');
    expect(html).toContain('Tactile Cockpit');
    expect(html).toContain('Original System');
    expect(html).toContain('Dark');
    expect(html).toContain('Light');
  });

  it('renders design inspiration for the active style in the info drawer', () => {
    const nothingHtml = renderToString(
      <PrototypeLabBar
        activeStyle="nothing"
        onChangeStyle={vi.fn()}
        colorMode="dark"
        onChangeColorMode={vi.fn()}
      />
    );

    expect(nothingHtml).toContain('NOTHING OS');
    expect(nothingHtml).toContain('Nothing Phone');
  });

  it('renders full App without top lab bar by default (clean production viewport)', () => {
    const html = renderToString(<App />);
    expect(html).not.toContain('2026 Prototype Lab');
    expect(html).toMatch(/Track Vertical Profile/i);
  });

  it('renders PrototypeLabBar in App when dev mode is enabled', () => {
    const mockStorage: Record<string, string> = { track_level_show_prototype_bar: 'true' };
    const originalLocalStorage = globalThis.localStorage;
    globalThis.localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
      clear: () => {},
      length: 1,
      key: () => null,
    } as Storage;

    try {
      const html = renderToString(<App />);
      expect(html).toContain('2026 Prototype Lab');
      expect(html).toContain('Nothing OS');
    } finally {
      globalThis.localStorage = originalLocalStorage;
    }
  });
});
