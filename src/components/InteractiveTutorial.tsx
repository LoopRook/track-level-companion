import React, { useEffect, useState, useRef } from 'react';
import {
  Compass,
  Ruler,
  TrendingUp,
  Hammer,
  CheckCircle2,
  Share2,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles
} from 'lucide-react';

export interface TutorialStepConfig {
  id: string;
  stepNumber: number;
  totalSteps: number;
  title: string;
  shortTitle: string;
  icon: React.ElementType;
  targetSelector: string; // e.g. '[data-tutorial="station-reading-0"]'
  content: string;
  proTip?: string;
  actionHint?: string;
  autoFillOnNext?: () => void;
}

interface InteractiveTutorialProps {
  isActive: boolean;
  currentStep: number;
  isKeypadOpen?: boolean;
  onNextStep: () => void;
  onPrevStep: () => void;
  onExitTutorial: () => void;
  onCompleteTutorial: () => void;
  onAutoFillStep?: (stepIndex: number) => void;
  onSimulateLevelStation?: (stationId: string, readingInches: number) => void;
  isStation5Leveled?: boolean;
}

export const TUTORIAL_STEPS: TutorialStepConfig[] = [
  {
    id: 'benchmark',
    stepNumber: 1,
    totalSteps: 7,
    title: '1. The Reference Benchmark (Station 0)',
    shortTitle: 'Benchmark',
    icon: Compass,
    targetSelector: '[data-tutorial="station-reading-0"]',
    content:
      'Every track leveling survey starts at Station 0. Imagine your rotary laser is set up on a tripod nearby. You place your grade rod on top of the rail head at Station 0 to establish your baseline elevation datum.',
    actionHint: 'Tap the cell to enter 5.25" with your keyboard/numpad or touch keys, or tap Next Step.',
    proTip: 'All other ties along your track will be compared against this reference datum.',
  },
  {
    id: 'survey-tie',
    stepNumber: 2,
    totalSteps: 7,
    title: '2. Surveying Ties Down the Line',
    shortTitle: 'Survey Tie',
    icon: Ruler,
    targetSelector: '[data-tutorial="station-reading-5"]',
    content:
      'Now walk 5 feet down the track to Station 5. Place the grade rod on the rail head and record the laser reading.',
    actionHint: 'Enter 5.625" (5-5/8") and press Enter or tap "Save & Analyze Track".',
    proTip:
      'Surveying rule: A LARGER rod reading (5.625" vs 5.25") means the detector slid lower—the rail head is physically dipped!',
  },
  {
    id: 'tolerance-margin',
    stepNumber: 3,
    totalSteps: 7,
    title: '3. The Tolerance Margin',
    shortTitle: 'Tolerance Margin',
    icon: CheckCircle2,
    targetSelector: '[data-tutorial="station-row-10"]',
    content:
      'Notice Station 10: The laser rod read 5.28"—which is 0.03" off your 5.25" target—yet its badge is green (ON GRADE ✓)! That is your tolerance margin (±0.05") in action. Railroad trackwork doesn\'t require millimeter perfection on every tie; staying within the green margin guarantees smooth running while saving hours of unnecessary shimming.',
    actionHint: 'Review Station 10\'s green ON GRADE status, then tap Next Step.',
    proTip:
      'You can customize your railroad\'s tolerance threshold (e.g., ±1/16" or ±1/8") in Settings anytime.',
  },
  {
    id: 'profile-graph',
    stepNumber: 4,
    totalSteps: 7,
    title: '4. Visualizing the Sag Dip',
    shortTitle: 'Profile Graph',
    icon: TrendingUp,
    targetSelector: '[data-tutorial="profile-chart"]',
    content:
      'The Profile Graph plots your entire rail surface in real time. Notice the visible sag dip between 0 ft and 10 ft. The green dashed line is your target grade plane.',
    actionHint: 'Review the sag in the curve, then tap Next Step.',
    proTip:
      'Uncorrected sags collect ponding rainwater, trigger ballast mud-pumping, and create jarring equipment dips when trains pass.',
  },
  {
    id: 'level-track',
    stepNumber: 5,
    totalSteps: 7,
    title: '5. Raising Rail Height: Jack & Tamp',
    shortTitle: 'Leveling Work',
    icon: Hammer,
    targetSelector: '[data-tutorial="station-action-5"]',
    content:
      'Station 5 requires lifting: LIFT +3/8" (Jack & Tamp). In the field, your crew places a track jack under Station 5, raises the rail 3/8", and tamps ballast underneath. Now simulate taking the verification shot after leveling!',
    actionHint: 'Tap "Simulate Lift & Re-shoot (5.25")" below, or tap Station 5 and enter 5.25".',
    proTip:
      'Taking a verification shot confirms the rail physically lifted to the target grade line and turns the tie green.',
  },
  {
    id: 'complete-check',
    stepNumber: 6,
    totalSteps: 7,
    title: '6. Crew Checkoff & Verification',
    shortTitle: 'Checkoff',
    icon: CheckCircle2,
    targetSelector: '[data-tutorial="station-complete-5"]',
    content:
      'With Station 5 raised to grade and verified green (ON GRADE ✓), tap the circle checkbox to mark Station 5 as finished work (LEVELED ✓).',
    actionHint: 'Tap the circle checkbox on Station 5 to mark it complete!',
    proTip:
      'Checking off completed ties keeps your track crew in sync so no one loses track of which ties are finished.',
  },
  {
    id: 'export-share',
    stepNumber: 7,
    totalSteps: 7,
    title: '7. Documenting & QR Sharing',
    shortTitle: 'Share & Export',
    icon: Share2,
    targetSelector: '[data-tutorial="header-actions"]',
    content:
      'Tap Files to download a CSV backup or print a clean inspection report for your railroad records. Or tap Share via QR Code to beam the track to a crew member\'s phone with zero internet!',
    actionHint: 'Tap Finish Practice Run to complete your tutorial.',
    proTip: 'Track Level Companion works 100% offline out in the woods or at the track.',
  },
];

export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  isActive,
  currentStep,
  isKeypadOpen = false,
  onNextStep,
  onPrevStep,
  onExitTutorial,
  onCompleteTutorial,
  onAutoFillStep,
  onSimulateLevelStation,
  isStation5Leveled = false,
}) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentStepData = TUTORIAL_STEPS[Math.min(currentStep, TUTORIAL_STEPS.length - 1)];

  // Update target bounding box on step change or resize/scroll
  useEffect(() => {
    if (!isActive || !currentStepData) return;

    const updateRect = () => {
      const candidates = Array.from(document.querySelectorAll(currentStepData.targetSelector));
      // Find the candidate element that is actually visible (not display: none from responsive views)
      const el =
        candidates.find((candidate) => {
          const r = candidate.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && window.getComputedStyle(candidate).display !== 'none';
        }) || candidates[0];

      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect((prev) => {
          if (
            prev &&
            Math.abs(prev.top - rect.top) < 1 &&
            Math.abs(prev.left - rect.left) < 1 &&
            Math.abs(prev.width - rect.width) < 1 &&
            Math.abs(prev.height - rect.height) < 1
          ) {
            return prev;
          }
          return rect;
        });

        // Scroll element into view smoothly if off-screen
        const isOffScreen =
          rect.top < 60 || rect.bottom > window.innerHeight - 120 || rect.left < 0 || rect.right > window.innerWidth;
        if (isOffScreen) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    const timeout = setTimeout(updateRect, 150);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [isActive, currentStep, currentStepData?.targetSelector]);

  if (!isActive || isKeypadOpen || !currentStepData) return null;

  const isLastStep = currentStep >= TUTORIAL_STEPS.length - 1;
  const StepIcon = currentStepData.icon;

  const handleNext = () => {
    if (onAutoFillStep) {
      onAutoFillStep(currentStep);
    }
    if (isLastStep) {
      onCompleteTutorial();
    } else {
      onNextStep();
    }
  };

  // Dynamic card positioning so the coachmark NEVER overlaps the target element
  const getCardStyle = (): React.CSSProperties => {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 850;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;

    const cardMaxWidth = Math.min(440, viewportWidth - 32);

    if (!targetRect) {
      return {
        position: 'fixed',
        bottom: '24px',
        left: isDesktop ? '24px' : '12px',
        maxWidth: `${cardMaxWidth}px`,
        width: isDesktop ? `${cardMaxWidth}px` : 'calc(100vw - 24px)',
      };
    }

    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    if (isDesktop) {
      // Side-by-side mode (Desktop / Laptop / Tablet Landscape):
      // If target is in the right half of the screen (e.g. ActionTable or header actions),
      // dock card securely on the LEFT side of the screen.
      if (targetCenterX > viewportWidth / 2) {
        return {
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          right: 'auto',
          maxWidth: `${cardMaxWidth}px`,
          width: `${cardMaxWidth}px`,
        };
      } else {
        // Target is in the left half of the screen (e.g. ProfileChart or StationConfig),
        // dock card securely on the RIGHT side of the screen.
        return {
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          left: 'auto',
          maxWidth: `${cardMaxWidth}px`,
          width: `${cardMaxWidth}px`,
        };
      }
    } else {
      // Single-column mode (Mobile portrait):
      // If target is in the upper half of the viewport, place card at the BOTTOM
      if (targetCenterY < viewportHeight / 2) {
        return {
          position: 'fixed',
          bottom: '16px',
          left: '12px',
          right: '12px',
          maxWidth: 'calc(100vw - 24px)',
          width: 'calc(100vw - 24px)',
        };
      } else {
        // Target is in the lower half of the viewport, place card at the TOP
        return {
          position: 'fixed',
          top: '16px',
          left: '12px',
          right: '12px',
          maxWidth: 'calc(100vw - 24px)',
          width: 'calc(100vw - 24px)',
        };
      }
    }
  };

  return (
    <div className="fixed inset-0 z-40 pointer-events-none overscroll-none">
      {/* Soft, Ambient Dimming Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/20 dark:bg-slate-950/30 backdrop-blur-[0.5px] pointer-events-none transition-opacity duration-300"
      />

      {/* Spotlight Cutout / Pulsing Border around Target Element */}
      {targetRect && (
        <div
          className="fixed pointer-events-none transition-all duration-300 ease-out z-40 rounded-xl ring-4 ring-amber-400 dark:ring-amber-400 ring-offset-2 ring-offset-black/70 shadow-[0_0_25px_rgba(251,191,36,0.6)] animate-pulse"
          style={{
            top: `${Math.max(4, targetRect.top - 4)}px`,
            left: `${Math.max(4, targetRect.left - 4)}px`,
            width: `${Math.min(window.innerWidth - 8, targetRect.width + 8)}px`,
            height: `${targetRect.height + 8}px`,
          }}
        />
      )}

      {/* Floating Coachmark Card (Dynamically positioned away from target element) */}
      <div
        ref={cardRef}
        style={getCardStyle()}
        className="z-50 pointer-events-auto bg-white dark:bg-zinc-950 border-2 border-amber-500/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-out animate-in fade-in"
      >
        {/* Top Header Bar */}
        <div className="bg-amber-500/10 dark:bg-amber-500/15 px-4 py-3 border-b border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold shadow-sm shrink-0">
              <StepIcon className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500 text-black">
                  Step {currentStepData.stepNumber} of {currentStepData.totalSteps}
                </span>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                  Interactive Practice Run
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white leading-tight">
                {currentStepData.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onExitTutorial}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition shrink-0"
            title="Exit Practice Tutorial"
            aria-label="Exit Tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Content */}
        <div className="p-4 sm:p-5 space-y-3">
          <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed font-medium">
            {currentStepData.content}
          </p>

          {/* Action Instruction Box */}
          {currentStepData.actionHint && (
            <div className="p-2.5 sm:p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200 font-semibold">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1">{currentStepData.actionHint}</div>
            </div>
          )}

          {/* Leveling Action Simulation Button in Step 5 */}
          {currentStepData.id === 'level-track' && onSimulateLevelStation && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => onSimulateLevelStation('tut-5', 5.25)}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2 ${
                  isStation5Leveled
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-extrabold'
                    : 'bg-amber-500 hover:bg-amber-400 text-black font-extrabold'
                }`}
              >
                {isStation5Leveled ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>✓ Leveled Re-shot: 5.25" (ON GRADE ✓)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>⚡ Simulate Lift & Re-shoot (5.25")</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Pro Tip Box */}
          {currentStepData.proTip && (
            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">Trackside Tip: </span>
              {currentStepData.proTip}
            </div>
          )}

          {/* Step Navigation Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {TUTORIAL_STEPS.map((s, idx) => (
              <div
                key={s.id}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  idx === currentStep
                    ? 'w-6 bg-amber-500'
                    : idx < currentStep
                    ? 'w-2 bg-emerald-500'
                    : 'w-2 bg-zinc-300 dark:bg-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/80 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onExitTutorial}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 px-2 py-1.5 rounded-lg transition"
          >
            Exit Tutorial
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={onPrevStep}
                className="px-3 py-2 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 rounded-xl text-xs font-black text-black bg-amber-500 hover:bg-amber-400 active:scale-95 transition shadow-sm flex items-center gap-1.5"
            >
              <span>{isLastStep ? 'Finish Practice Run' : 'Next Step'}</span>
              {isLastStep ? (
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
