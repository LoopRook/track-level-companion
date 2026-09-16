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
  onNextStep: () => void;
  onPrevStep: () => void;
  onExitTutorial: () => void;
  onCompleteTutorial: () => void;
  onAutoFillStep?: (stepIndex: number) => void;
}

export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  isActive,
  currentStep,
  onNextStep,
  onPrevStep,
  onExitTutorial,
  onCompleteTutorial,
  onAutoFillStep,
}) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const steps: TutorialStepConfig[] = [
    {
      id: 'benchmark',
      stepNumber: 1,
      totalSteps: 6,
      title: '1. The Reference Benchmark (Station 0)',
      shortTitle: 'Benchmark',
      icon: Compass,
      targetSelector: '[data-tutorial="station-reading-0"]',
      content:
        'Every track leveling survey starts at Station 0. Imagine your rotary laser is set up on a tripod nearby. You place your grade rod on top of the rail head at Station 0 to establish your baseline elevation.',
      actionHint: 'Tap the reading cell to enter 5.25" with the keypad, or tap Next Step.',
      proTip: 'All other ties along your track will be compared against this reference datum.',
    },
    {
      id: 'survey-tie',
      stepNumber: 2,
      totalSteps: 6,
      title: '2. Surveying Ties Down the Line',
      shortTitle: 'Survey Tie',
      icon: Ruler,
      targetSelector: '[data-tutorial="station-reading-5"]',
      content:
        'Now walk 5 feet down the track to Station 5. Place the grade rod on the rail head and record the laser reading.',
      actionHint: 'Tap the cell to enter 5.625" (5-5/8"), or tap Next Step.',
      proTip:
        'Surveying rule: A LARGER rod reading (5.625" vs 5.25") means the detector slid down lower—the rail head is physically dipped!',
    },
    {
      id: 'profile-graph',
      stepNumber: 3,
      totalSteps: 6,
      title: '3. Reading the Vertical Profile Graph',
      shortTitle: 'Profile Graph',
      icon: TrendingUp,
      targetSelector: '[data-tutorial="profile-chart"]',
      content:
        'The Profile Graph plots your rail surface in real time. Notice the visible sag dip between 0 ft and 10 ft. The green dashed line is your target grade.',
      actionHint: 'Review the sag in the curve, then tap Next Step.',
      proTip:
        'Uncorrected sags cause ponding water, mud pumping, and jarring equipment dips during train operations.',
    },
    {
      id: 'action-math',
      stepNumber: 4,
      totalSteps: 6,
      title: '4. The Cut/Fill Action (Jack & Tamp)',
      shortTitle: 'Cut/Fill Action',
      icon: Hammer,
      targetSelector: '[data-tutorial="station-action-5"]',
      content:
        'The app computes the exact track work required: Jack 3/8" (Lift & Tamp). It calculates whether each tie needs lifting or lowering to meet the target grade.',
      actionHint: 'Observe the calculated Jack amount, then tap Next Step.',
      proTip:
        'Use this exact number to slide in matching shims or adjust your track jack before tamping ballast.',
    },
    {
      id: 'complete-check',
      stepNumber: 5,
      totalSteps: 6,
      title: '5. Leveling to Green & Checkoff',
      shortTitle: 'Checkoff',
      icon: CheckCircle2,
      targetSelector: '[data-tutorial="station-complete-5"]',
      content:
        'Once your crew jacks and tamps the tie, take a verification shot. When the reading matches the target, the tie turns green (ON GRADE ✓).',
      actionHint: 'Tap the circle checkbox on Station 5 to mark it completed!',
      proTip:
        'Checking off completed ties keeps your crew organized so no one loses track of which ties are finished.',
    },
    {
      id: 'export-share',
      stepNumber: 6,
      totalSteps: 6,
      title: '6. Documenting & QR Sharing',
      shortTitle: 'Share & Export',
      icon: Share2,
      targetSelector: '[data-tutorial="header-actions"]',
      content:
        'Tap Files to download a CSV backup or print a clean inspection report for your railroad records. Or tap Share via QR Code to beam the track to a crew member\'s phone with zero internet!',
      actionHint: 'Tap Finish Practice Run to complete your tutorial.',
      proTip: 'Track Level Companion works 100% offline out in the woods or at the track.',
    },
  ];

  const currentStepData = steps[Math.min(currentStep, steps.length - 1)];

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
        setTargetRect(rect);
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
  }, [isActive, currentStep, currentStepData]);

  if (!isActive || !currentStepData) return null;

  const isLastStep = currentStep >= steps.length - 1;
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

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-end sm:justify-start overscroll-none">
      {/* Semi-transparent Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 pointer-events-none transition-opacity duration-300"
      />

      {/* Spotlight Cutout / Pulsing Border around Target Element */}
      {targetRect && (
        <div
          className="fixed pointer-events-none transition-all duration-300 ease-out z-50 rounded-xl ring-4 ring-amber-400 dark:ring-amber-400 ring-offset-2 ring-offset-black/70 shadow-[0_0_25px_rgba(251,191,36,0.6)] animate-pulse"
          style={{
            top: `${Math.max(4, targetRect.top - 4)}px`,
            left: `${Math.max(4, targetRect.left - 4)}px`,
            width: `${Math.min(window.innerWidth - 8, targetRect.width + 8)}px`,
            height: `${targetRect.height + 8}px`,
          }}
        />
      )}

      {/* Floating Coachmark Card (Floats securely at bottom on mobile, or bottom-center/bottom-right on desktop) */}
      <div
        ref={cardRef}
        className="relative z-50 pointer-events-auto m-3 sm:m-6 max-w-xl sm:mx-auto w-full self-center bg-white dark:bg-zinc-950 border-2 border-amber-500/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-4"
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

          {/* Pro Tip Box */}
          {currentStepData.proTip && (
            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">Trackside Tip: </span>
              {currentStepData.proTip}
            </div>
          )}

          {/* Step Navigation Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {steps.map((s, idx) => (
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
