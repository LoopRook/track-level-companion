import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MobileSimulator } from './MobileSimulator';

describe('MobileSimulator Component', () => {
  it('renders nothing when isOpen is false', () => {
    const html = renderToString(
      <MobileSimulator
        isOpen={false}
        onClose={vi.fn()}
        mobileLayout="bottom_nav"
        onChangeMobileLayout={vi.fn()}
      />
    );
    expect(html).toBe('');
  });

  it('renders mobile simulator frame with device presets and iframe when open', () => {
    const html = renderToString(
      <MobileSimulator
        isOpen={true}
        onClose={vi.fn()}
        mobileLayout="bottom_nav"
        onChangeMobileLayout={vi.fn()}
      />
    );

    expect(html).toContain('Mobile Mode Simulator');
    expect(html).toContain('iPhone 15');
    expect(html).toContain('Pixel 8');
    expect(html).toContain('Compact Field Phone');
    expect(html).toContain('Bottom Dock');
    expect(html).toContain('Top Tabs');
    expect(html).toContain('Stacked');
    expect(html).toContain('Desktop View');
    expect(html).toContain('embedded_mobile=1');
  });
});