import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import App from './App';

describe('App Component SSR render', () => {
  it('renders App without crashing', () => {
    const html = renderToString(<App />);
    expect(html).toContain('Track Vertical Profile');
    expect(html).toContain('Trackside Leveling Checklist');
    expect(html).toContain('Track Section Name');
  });
});
