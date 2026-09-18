import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import App from './App';

describe('App Component SSR render', () => {
  it('renders App without crashing', () => {
    const html = renderToString(<App />);
    expect(html).toContain('Track Vertical Profile');
    expect(html).toMatch(/Trackside Leveling Checklist/i);
    expect(html).toContain('Track Section Name');
  });

  it('renders mobile bottom dock navigation by default', () => {
    const html = renderToString(<App />);
    expect(html).toContain('Mobile Bottom Navigation');
    expect(html).toContain('+ Add Next');
    expect(html).toContain('Checklist');
    expect(html).toContain('Profile');
  });
});

