import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { CustomPointModal } from './CustomPointModal';

describe('CustomPointModal Component', () => {
  it('renders modal with Nothing OS title and fields when open', () => {
    const html = renderToString(
      <CustomPointModal
        isOpen={true}
        onClose={vi.fn()}
        onInsert={vi.fn()}
        existingDistances={[0, 5, 10]}
        defaultDistance={12.5}
        prototypeStyle="nothing"
      />
    );

    expect(html).toContain('[ INSERT CUSTOM POINT ]');
    expect(html).toContain('Station Distance (Feet along track):');
    expect(html).toContain('value="12.5"');
    expect(html).toContain('Quick Adjustments:');
    expect(html).toContain('+1 ft');
    expect(html).toContain('+2.5 ft');
    expect(html).toContain('+5 ft');
    expect(html).toContain('Insert Point');
  });

  it('renders nothing when isOpen is false', () => {
    const html = renderToString(
      <CustomPointModal
        isOpen={false}
        onClose={vi.fn()}
        onInsert={vi.fn()}
        existingDistances={[0, 5, 10]}
      />
    );

    expect(html).toBe('');
  });
});
