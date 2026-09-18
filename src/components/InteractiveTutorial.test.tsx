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
    expect(html).toContain('Start Tutorial');
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

    expect(html).toMatch(/Step\s*(<!-- -->)?\s*1\s*(<!-- -->)?\s*of\s*(<!-- -->)?\s*7/);
    expect(html).toContain('1. The Reference Benchmark (Station 0)');
    expect(html).toContain('Every track leveling survey starts at Station 0');
    expect(html).toContain('Action Required');
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

    expect(html).toMatch(/Step\s*(<!-- -->)?\s*2\s*(<!-- -->)?\s*of\s*(<!-- -->)?\s*7/);
    expect(html).toContain('2. Surveying Ties Down the Line');
    expect(html).toContain('LARGER rod reading');
    expect(html).toContain('Back');
  });

  it('renders Step 3 (The Tolerance Margin) correctly', () => {
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

    expect(html).toMatch(/Step\s*(<!-- -->)?\s*3\s*(<!-- -->)?\s*of\s*(<!-- -->)?\s*7/);
    expect(html).toContain('3. The Tolerance Margin');
    expect(html).toContain('tolerance margin (±0.05&quot;) in action');
  });

  it('renders Step 4 (Visualizing the Sag Dip) correctly', () => {
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

    expect(html).toMatch(/Step\s*(<!-- -->)?\s*4\s*(<!-- -->)?\s*of\s*(<!-- -->)?\s*7/);
    expect(html).toContain('4. Visualizing the Sag Dip');
    expect(html).toContain('visible sag dip between 0 ft and 10 ft');
  });

  it('renders Step 5 (Verification Shot: Raise to Grade) correctly', () => {
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

    expect(html).toMatch(/Step\s*(<!-- -->)?\s*5\s*(<!-- -->)?\s*of\s*(<!-- -->)?\s*7/);
    expect(html).toContain('5. Verification Shot: Raise to Grade');
    expect(html).toContain('record your verification shot');
  });

  it('renders Step 6 (Crew Checkoff & Verification) correctly', () => {
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

    expect(html).toMatch(/Step\s*(<!-- -->)?\s*6\s*(<!-- -->)?\s*of\s*(<!-- -->)?\s*7/);
    expect(html).toContain('6. Crew Checkoff &amp; Verification');
    expect(html).toContain('LEVELED ✓');
  });

  it('renders Step 7 (Documenting & QR Sharing) correctly with Finish button', () => {
    const html = renderToString(
      <InteractiveTutorial
        isActive={true}
        currentStep={6}
        onNextStep={vi.fn()}
        onPrevStep={vi.fn()}
        onExitTutorial={vi.fn()}
        onCompleteTutorial={vi.fn()}
      />
    );

    expect(html).toMatch(/Step\s*(<!-- -->)?\s*7\s*(<!-- -->)?\s*of\s*(<!-- -->)?\s*7/);
    expect(html).toContain('7. Documenting &amp; QR Sharing');
    expect(html).toContain('Finish Tutorial');
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

  it('renders compact guide banner when isKeypadOpen is true so guidance remains active', () => {
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

    expect(html).toContain('Tutorial:');
    expect(html).toContain('Tap the cell to enter 5.25');
  });

  it('renders with Nothing OS design system when prototypeStyle is nothing', () => {
    const html = renderToString(
      <InteractiveTutorial
        isActive={true}
        currentStep={0}
        prototypeStyle="nothing"
        isDarkMode={true}
        onNextStep={vi.fn()}
        onPrevStep={vi.fn()}
        onExitTutorial={vi.fn()}
        onCompleteTutorial={vi.fn()}
      />
    );

    expect(html).toContain('Space_Mono');
    expect(html).toContain('#D71921');
    expect(html).toContain('Action Required');
  });

  it('renders ultra-compact Action HUD with flip and details buttons on mobile', () => {
    const originalWindow = (globalThis as any).window;
    (globalThis as any).window = { innerWidth: 390, innerHeight: 844 };
    try {
      const html = renderToString(
        <InteractiveTutorial
          isActive={true}
          currentStep={0}
          prototypeStyle="nothing"
          isDarkMode={true}
          onNextStep={vi.fn()}
          onPrevStep={vi.fn()}
          onExitTutorial={vi.fn()}
          onCompleteTutorial={vi.fn()}
        />
      );

      expect(html).toContain('data-testid="tutorial-flip-btn"');
      expect(html).toContain('data-testid="tutorial-details-toggle"');
      expect(html).toContain('Up');
    } finally {
      (globalThis as any).window = originalWindow;
    }
  });

  it('enforces action on action-required steps and displays Next Step on informational steps', () => {
    // Step 0: requiresAction = true -> Action Required, no Next Step
    const actionHtml = renderToString(
      <InteractiveTutorial
        isActive={true}
        currentStep={0}
        onNextStep={vi.fn()}
        onPrevStep={vi.fn()}
        onExitTutorial={vi.fn()}
        onCompleteTutorial={vi.fn()}
      />
    );
    expect(actionHtml).toContain('data-testid="tutorial-action-required"');
    expect(actionHtml).not.toContain('Next Step');

    // Step 2: requiresAction = false -> Next Step, no Action Required
    const infoHtml = renderToString(
      <InteractiveTutorial
        isActive={true}
        currentStep={2}
        onNextStep={vi.fn()}
        onPrevStep={vi.fn()}
        onExitTutorial={vi.fn()}
        onCompleteTutorial={vi.fn()}
      />
    );
    expect(infoHtml).toContain('Next Step');
    expect(infoHtml).not.toContain('data-testid="tutorial-action-required"');
  });

  it('renders dark text and high contrast borders in light mode', () => {
    const html = renderToString(
      <InteractiveTutorial
        isActive={true}
        currentStep={0}
        prototypeStyle="nothing"
        isDarkMode={false}
        onNextStep={vi.fn()}
        onPrevStep={vi.fn()}
        onExitTutorial={vi.fn()}
        onCompleteTutorial={vi.fn()}
      />
    );
    expect(html).toContain('bg-white');
    expect(html).toContain('text-zinc-950');
    expect(html).toContain('border-zinc-300');
  });
});
