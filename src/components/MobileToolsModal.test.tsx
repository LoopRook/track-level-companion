import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MobileToolsModal } from './MobileToolsModal';

describe('MobileToolsModal Component', () => {
  it('renders all 5 integrated tool sections when open', () => {
    const html = renderToString(
      <MobileToolsModal
        isOpen={true}
        onClose={vi.fn()}
        onOpenNewTrack={vi.fn()}
        onOpenDataModal={vi.fn()}
        onOpenTutorials={vi.fn()}
        onOpenGuide={vi.fn()}
        onOpenSettings={vi.fn()}
        prototypeStyle="nothing"
        isDarkMode={true}
      />
    );

    expect(html).toContain('Start New Track');
    expect(html).toContain('Project Files &amp; Export');
    expect(html).toContain('Interactive Tutorials');
    expect(html).toContain('Field Guide &amp; Handbook');
    expect(html).toContain('Leveling &amp; App Settings');
    expect(html).toContain('FIELD TOOLS &amp; SETTINGS');
  });

  it('renders nothing when closed', () => {
    const html = renderToString(
      <MobileToolsModal
        isOpen={false}
        onClose={vi.fn()}
        onOpenNewTrack={vi.fn()}
        onOpenDataModal={vi.fn()}
        onOpenTutorials={vi.fn()}
        onOpenGuide={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    expect(html).toBe('');
  });
});