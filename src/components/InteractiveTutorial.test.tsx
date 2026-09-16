import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { InteractiveTutorial } from './InteractiveTutorial';
import { FirstTimeWelcomeModal } from './FirstTimeWelcomeModal';

describe('FirstTimeWelcomeModal Component', () => {
  it('renders welcome dialog with 3 key options when open', () => {
    const html = renderToString(
      <FirstTimeWelcomeModal
        isOpen={true}
        onClose={vi.fn()}
        onStartTutorial={vi.fn()}
        onExploreDemo={vi.fn()}
        onStartBlankTrack={vi.fn()}
      />
    );

    expect(html).toContain('Welcome to Track Level Companion');
    expect(html).toContain('Start 90-Second Practice Tutorial');
    expect(html).toContain('Explore Sample Track (85ft Demo)');
    expect(html).toContain('Start Blank Field Survey');
    expect(html).toContain('Recommended');
  });

  it('renders nothing when isOpen is false', () => {
    const html = renderToString(
      <FirstTimeWelcomeModal
        isOpen={false}
        onClose={vi.fn()}
        onStartTutorial={vi.fn()}
        onExploreDemo={vi.fn()}
        onStartBlankTrack={vi.fn()}
      />
    );

    expect(html).toBe('');
  });
});

describe('InteractiveTutorial Component', () => {
  it('renders Step 1 (Station 0 Benchmark) correctly', () => {
    const html = renderToString(
      <InteractiveTutorial
        isActive={true}
        currentStep={0}
        onNextStep={vi.fn()}
        onPrevStep={vi.fn()}
        onExitTutorial={vi.fn()}
        onCompleteTutorial={vi.fn()}
      />
    );

    expect(html).toMatch(/Step\s*(<!-- -->)?\s*1\s*(<!-- -->)?\s*of\s*(<!-- -->)?\s*6/);
    expect(html).toContain('1. The Reference Benchmark (Station 0)');
    expect(html).toContain('Every track leveling survey starts at Station 0');
    expect(html).toContain('Next Step');
    expect(html).toContain('Exit Tutorial');
  });

  it('renders Step 2 (Surveying Ties Down the Line) correctly', () => {
    const html = renderToString(
      <InteractiveTutorial
        isActive={true}
        currentStep={1}
        onNextStep={vi.fn()}
        onPrevStep={vi.fn()}
        onExitTutorial={vi.fn()}
        onCompleteTutorial={vi.fn()}
      />
    );

    expect(html).toMatch(/Step\s*(<!-- -->)?\s*2\s*(<!-- -->)?\s*of\s*(<!-- -->)?\s*6/);
    expect(html).toContain('2. Surveying Ties Down the Line');
    expect(html).toContain('LARGER rod reading');
    expect(html).toContain('Back');
  });

  it('renders Step 3 (Profile Graph) correctly', () => {
    const html = renderToString(
      <InteractiveTutorial
        isActive={true}
        currentStep={2}
        onNextStep={vi.fn()}
        onPrevStep={vi.fn()}
        onExitTutorial={vi.fn()}
        onCompleteTutorial={vi.fn()}
      />
    );

    expect(html).toMatch(/Step\s*(<!-- -->)?\s*3\s*(<!-- -->)?\s*of\s*(<!-- -->)?\s*6/);
    expect(html).toContain('3. Reading the Vertical Profile Graph');
    expect(html).toContain('visible sag dip between 0 ft and 10 ft');
  });

  it('renders Step 4 (Cut/Fill Action) correctly', () => {
    const html = renderToString(
      <InteractiveTutorial
        isActive={true}
        currentStep={3}
        onNextStep={vi.fn()}
        onPrevStep={vi.fn()}
        onExitTutorial={vi.fn()}
        onCompleteTutorial={vi.fn()}
      />
    );

    expect(html).toMatch(/Step\s*(<!-- -->)?\s*4\s*(<!-- -->)?\s*of\s*(<!-- -->)?\s*6/);
    expect(html).toContain('4. The Cut/Fill Action (Jack &amp; Tamp)');
    expect(html).toContain('Jack 3/8&quot; (Lift &amp; Tamp)');
  });

  it('renders Step 5 (Leveling & Checkoff) correctly', () => {
    const html = renderToString(
      <InteractiveTutorial
        isActive={true}
        currentStep={4}
        onNextStep={vi.fn()}
        onPrevStep={vi.fn()}
        onExitTutorial={vi.fn()}
        onCompleteTutorial={vi.fn()}
      />
    );

    expect(html).toMatch(/Step\s*(<!-- -->)?\s*5\s*(<!-- -->)?\s*of\s*(<!-- -->)?\s*6/);
    expect(html).toContain('5. Leveling to Green &amp; Checkoff');
    expect(html).toContain('ON GRADE ✓');
  });

  it('renders Step 6 (Documenting & QR Sharing) correctly with Finish button', () => {
    const html = renderToString(
      <InteractiveTutorial
        isActive={true}
        currentStep={5}
        onNextStep={vi.fn()}
        onPrevStep={vi.fn()}
        onExitTutorial={vi.fn()}
        onCompleteTutorial={vi.fn()}
      />
    );

    expect(html).toMatch(/Step\s*(<!-- -->)?\s*6\s*(<!-- -->)?\s*of\s*(<!-- -->)?\s*6/);
    expect(html).toContain('6. Documenting &amp; QR Sharing');
    expect(html).toContain('Finish Practice Run');
  });

  it('renders nothing when isActive is false', () => {
    const html = renderToString(
      <InteractiveTutorial
        isActive={false}
        currentStep={0}
        onNextStep={vi.fn()}
        onPrevStep={vi.fn()}
        onExitTutorial={vi.fn()}
        onCompleteTutorial={vi.fn()}
      />
    );

    expect(html).toBe('');
  });

  it('renders nothing when isKeypadOpen is true (yields to keypad to prevent overlap)', () => {
    const html = renderToString(
      <InteractiveTutorial
        isActive={true}
        currentStep={0}
        isKeypadOpen={true}
        onNextStep={vi.fn()}
        onPrevStep={vi.fn()}
        onExitTutorial={vi.fn()}
        onCompleteTutorial={vi.fn()}
      />
    );

    expect(html).toBe('');
  });
});
