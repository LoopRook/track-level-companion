import React, { useEffect, useState, useRef } from 'react';
import {
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles
} from 'lucide-react';

import { TutorialStepConfig, TUTORIAL_GETTING_STARTED } from '../core/tutorials';
export type { TutorialStepConfig };

export interface InteractiveTutorialProps {
  isActive: boolean;
  currentStep: number;
  steps?: TutorialStepConfig[];
  tutorialCategory?: string;
  isKeypadOpen?: boolean;
  onNextStep: () => void;
  onPrevStep: () => void;
  onExitTutorial: () => void;
  onCompleteTutorial: () => void;
  onAutoFillStep?: (stepIndex: number) => void;
}

export const TUTORIAL_STEPS: TutorialStepConfig[] = TUTORIAL_GETTING_STARTED.steps;

export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  isActive,
  currentStep,
  steps,
  tutorialCategory,
  isKeypadOpen = false,
  onNextStep,
  onPrevStep,
  onExitTutorial,
  onCompleteTutorial,
  onAutoFillStep,
}) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const activeSteps = steps && steps.length > 0 ? steps : TUTORIAL_STEPS;
  const currentStepData = activeSteps[Math.min(currentStep, activeSteps.length - 1)];

  // Update target bounding box on step change or resize/scroll/input
  useEffect(() => {
    if (!isActive || !currentStepData) return;

    let hasScrolledIntoView = false;
    let animFrameId: number;
    let resizeObserver: ResizeObserver | null = null;

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
            Math.abs(prev.top - rect.top) < 0.5 &&
            Math.abs(prev.left - rect.left) < 0.5 &&
            Math.abs(prev.width - rect.width) < 0.5 &&
            Math.abs(prev.height - rect.height) < 0.5
          ) {
            return prev;
          }
          return rect;
        });

        // Scroll element into view smoothly once when step loads if off-screen
        if (!hasScrolledIntoView) {
          const isOffScreen =
            rect.top < 60 || rect.bottom > window.innerHeight - 120 || rect.left < 0 || rect.right > window.innerWidth;
          if (isOffScreen) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          hasScrolledIntoView = true;
        }

        // Dynamically observe the target element, its parent, and body for any size shifts
        if (!resizeObserver && typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(() => {
            updateRect();
          });
          resizeObserver.observe(el);
          if (el.parentElement) {
            resizeObserver.observe(el.parentElement);
          }
          if (document.body) {
            resizeObserver.observe(document.body);
          }
        }
      } else {
        setTargetRect(null);
      }
    };

    updateRect();

    // Continuous smooth animation-frame tracking so typing or modal layout shifts are tracked instantly
    const trackLoop = () => {
      updateRect();
      animFrameId = requestAnimationFrame(trackLoop);
    };
    animFrameId = requestAnimationFrame(trackLoop);

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('input', updateRect, true);
    window.addEventListener('change', updateRect, true);

    return () => {
      cancelAnimationFrame(animFrameId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('input', updateRect, true);
      window.removeEventListener('change', updateRect, true);
    };
  }, [isActive, currentStep, currentStepData?.targetSelector]);

  if (!isActive || isKeypadOpen || !currentStepData) return null;

  const isLastStep = currentStep >= activeSteps.length - 1;
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
      // If target is in the right half or center of the screen (e.g. ActionTable, header actions, or centered modals),
      // dock card securely on the LEFT side of the screen where there is plenty of room.
      if (targetCenterX >= viewportWidth * 0.45) {
        return {
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          right: 'auto',
          maxWidth: `${cardMaxWidth}px`,
          width: `${cardMaxWidth}px`,
        };
      } else {
        // Target is on the left side of the screen (e.g. ProfileChart or StationConfig),
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
    <div className="fixed inset-0 z-[60] pointer-events-none overscroll-none">
      {/* Soft, Ambient Dimming Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/20 dark:bg-slate-950/30 backdrop-blur-[0.5px] pointer-events-none transition-opacity duration-300"
      />

      {/* Spotlight Cutout / Pulsing Border around Target Element */}
      {targetRect && (
        <div
          className="fixed pointer-events-none transition-all duration-100 ease-out z-[60] rounded-xl ring-4 ring-amber-400 dark:ring-amber-400 ring-offset-2 ring-offset-black/70 shadow-[0_0_25px_rgba(251,191,36,0.6)] animate-pulse"
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
        className="z-[60] pointer-events-auto bg-white dark:bg-zinc-950 border-2 border-amber-500/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-out animate-in fade-in"
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
                  {tutorialCategory || 'Tutorial'}
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
            title="Exit Tutorial"
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
              <span className="font-bold text-zinc-800 dark:text-zinc-200">Tip: </span>
              {currentStepData.proTip}
            </div>
          )}

          {/* Step Navigation Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {activeSteps.map((s, idx) => (
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
              <span>{isLastStep ? 'Finish Tutorial' : 'Next Step'}</span>
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
