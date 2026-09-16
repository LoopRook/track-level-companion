import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { FractionKeypad } from './FractionKeypad';

describe('FractionKeypad Component', () => {
  it('renders nothing when isOpen is false', () => {
    const html = renderToString(
      <FractionKeypad
        isOpen={false}
        stationDistanceFt={0}
        currentReadingInches={null}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(html).toBe('');
  });

  it('renders keypad with desktop keyboard & numpad hint when open', () => {
    const html = renderToString(
      <FractionKeypad
        isOpen={true}
        stationDistanceFt={0}
        currentReadingInches={null}
        unitFormat="decimal_inches"
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain('Recording Station');
    expect(html).toMatch(/0\s*(<!-- -->)?\s*ft/);
    expect(html).toContain('Decimal In');
    // Desktop keyboard hint
    expect(html).toContain('type on Numpad/Keyboard');
    expect(html).toContain('Enter to Save');
  });

  it('renders tutorialHint banner when in interactive tutorial mode', () => {
    const html = renderToString(
      <FractionKeypad
        isOpen={true}
        stationDistanceFt={0}
        currentReadingInches={null}
        tutorialHint="Benchmark: Enter 5.25&quot; using numpad or keys, then press Enter or Save"
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain('Tutorial');
    expect(html).toContain('Benchmark: Enter 5.25&quot; using numpad or keys, then press Enter or Save');
  });

  it('renders target measurement badge when targetReadingInches is provided', () => {
    const html = renderToString(
      <FractionKeypad
        isOpen={true}
        stationDistanceFt={5}
        currentReadingInches={5.625}
        targetReadingInches={5.25}
        actionText="Jack 3/8&quot;"
        unitFormat="decimal_inches"
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain('Target:');
    expect(html).toContain('5.25');
  });

  it('renders custom tutorialSaveButtonLabel when provided in tutorial mode', () => {
    const html = renderToString(
      <FractionKeypad
        isOpen={true}
        stationDistanceFt={5}
        currentReadingInches={5.625}
        tutorialSaveButtonLabel="Save &amp; Analyze Track →"
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain('Save &amp; Analyze Track →');
  });
});
