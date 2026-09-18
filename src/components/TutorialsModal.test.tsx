import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { TutorialsModal } from './TutorialsModal';
import { InteractiveTutorial } from './InteractiveTutorial';
import {
  ALL_TUTORIALS,
  TUTORIAL_LOCKED_POINTS,
  TUTORIAL_EVALUATE_GRADE,
  TUTORIAL_LASER_RELOCATION,
} from '../core/tutorials';

describe('TutorialsModal Component', () => {
  it('renders all 4 tutorials with descriptions and time estimates when open', () => {
    const html = renderToString(
      <TutorialsModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectTutorial={vi.fn()}
      />
    );

    expect(html).toContain('Interactive Tutorials');
    expect(html).toContain('Getting Started: The Field Survey Cycle');
    expect(html).toContain('Locked Control Points: Fixed Obstacles');
    expect(html).toContain('Evaluate Grade: Checking Slopes');
    expect(html).toContain('Laser Relocation &amp; Turning Points');

    // Categories
    expect(html).toContain('Basics');
    expect(html).toContain('Grade &amp; Align');
    expect(html).toContain('Field Operations');

    // Durations
    expect(html).toContain('2 min');
    expect(html).toContain('90 sec');
    expect(html).toContain('60 sec');

    // Buttons
    expect(html).toContain('data-tutorial-launch="getting-started"');
    expect(html).toContain('data-tutorial-launch="locked-points"');
    expect(html).toContain('data-tutorial-launch="evaluate-grade"');
    expect(html).toContain('data-tutorial-launch="laser-relocation"');
  });

  it('renders nothing when isOpen is false', () => {
    const html = renderToString(
      <TutorialsModal
        isOpen={false}
        onClose={vi.fn()}
        onSelectTutorial={vi.fn()}
      />
    );

    expect(html).toBe('');
  });

  it('renders with Nothing OS design system when prototypeStyle is nothing', () => {
    const html = renderToString(
      <TutorialsModal
        isOpen={true}
        prototypeStyle="nothing"
        isDarkMode={true}
        onClose={vi.fn()}
        onSelectTutorial={vi.fn()}
      />
    );

    expect(html).toContain('[ INTERACTIVE TUTORIALS ]');
    expect(html).toContain('Space_Mono');
    expect(html).toContain('#D71921');
  });

  it('has 4 registered tutorials in ALL_TUTORIALS registry', () => {
    expect(ALL_TUTORIALS).toHaveLength(4);
    const ids = ALL_TUTORIALS.map(t => t.id);
    expect(ids).toEqual(['getting-started', 'locked-points', 'evaluate-grade', 'laser-relocation']);
  });
});

describe('InteractiveTutorial with Modular Tutorial Definitions', () => {
  it('renders Locked Points tutorial step 1', () => {
    const html = renderToString(
      <InteractiveTutorial
        isActive={true}
        currentStep={0}
        steps={TUTORIAL_LOCKED_POINTS.steps}
        tutorialCategory={TUTORIAL_LOCKED_POINTS.category}
        onNextStep={vi.fn()}
        onPrevStep={vi.fn()}
        onExitTutorial={vi.fn()}
        onCompleteTutorial={vi.fn()}
      />
    );

    expect(html).toMatch(/Step\s*(<!-- -->)?\s*1\s*(<!-- -->)?\s*of\s*(<!-- -->)?\s*4/);
    expect(html).toContain('1. The Fixed Obstacle Dilemma');
    expect(html).toContain('Grade &amp; Align');
    expect(html).toContain('Next Step');
  });

  it('renders Evaluate Grade tutorial step 1', () => {
    const html = renderToString(
      <InteractiveTutorial
        isActive={true}
        currentStep={0}
        steps={TUTORIAL_EVALUATE_GRADE.steps}
        tutorialCategory={TUTORIAL_EVALUATE_GRADE.category}
        onNextStep={vi.fn()}
        onPrevStep={vi.fn()}
        onExitTutorial={vi.fn()}
        onCompleteTutorial={vi.fn()}
      />
    );

    expect(html).toContain('1. Activate Evaluate Grade Tool');
    expect(html).toContain('Grade &amp; Align');
  });

  it('renders Laser Relocation tutorial step 1', () => {
    const html = renderToString(
      <InteractiveTutorial
        isActive={true}
        currentStep={0}
        steps={TUTORIAL_LASER_RELOCATION.steps}
        tutorialCategory={TUTORIAL_LASER_RELOCATION.category}
        onNextStep={vi.fn()}
        onPrevStep={vi.fn()}
        onExitTutorial={vi.fn()}
        onCompleteTutorial={vi.fn()}
      />
    );

    expect(html).toContain('1. The Turning Point Benchmark');
    expect(html).toContain('Field Operations');
  });
});
