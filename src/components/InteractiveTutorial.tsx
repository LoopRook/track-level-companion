import React, { useEffect, useState, useRef } from 'react';
import {
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ArrowUpDown,
  Info,
  ChevronUp,
} from 'lucide-react';

import { TutorialStepConfig, TUTORIAL_GETTING_STARTED } from '../core/tutorials';
export type { TutorialStepConfig };

export interface InteractiveTutorialProps {
  isActive: boolean;
  currentStep: number;
  steps?: TutorialStepConfig[];
  tutorialCategory?: string;
  isKeypadOpen?: boolean;
  prototypeStyle?: string;
  isDarkMode?: boolean;
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
  prototypeStyle = 'original',
  isDarkMode = true,
  onNextStep,
  onPrevStep,
  onExitTutorial,
  onCompleteTutorial,
  onAutoFillStep,
}) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [userPositionOverride, setUserPositionOverride] = useState<'auto' | 'top' | 'bottom'>('auto');
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const activeSteps = steps && steps.length > 0 ? steps : TUTORIAL_STEPS;
  const currentStepData = activeSteps[Math.min(currentStep, activeSteps.length - 1)];

  // Reset user override and details collapse when step changes
  useEffect(() => {
    setUserPositionOverride('auto');
    setShowDetails(false);
  }, [currentStep]);

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
          const isMobile = window.innerWidth < 850;
          const isOffScreen =
            rect.top < 60 || rect.bottom > window.innerHeight - 120 || rect.left < 0 || rect.right > window.innerWidth;
          if (isOffScreen) {
            el.scrollIntoView({
              behavior: 'smooth',
              block: isMobile ? 'start' : 'center',
            });
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

  if (!isActive || !currentStepData) return null;

  const isLastStep = currentStep >= activeSteps.length - 1;
  const StepIcon = currentStepData.icon;
  const isNothing = prototypeStyle === 'nothing';

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

  // If mobile keypad is open, show a minimal, non-intrusive guide banner at top
  // so the tutorial DOES NOT vanish and still gives the exact number to enter!
  if (isKeypadOpen) {
    return (
      <div className="fixed top-2 left-2 right-2 z-[70] pointer-events-auto flex items-center justify-between gap-2 px-3 py-2 rounded-xl border bg-black/95 text-white border-[#D71921] shadow-2xl animate-in slide-in-from-top-3 font-['Space_Mono']">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-[#D71921] shrink-0 animate-pulse" />
          <div className="text-[11px] leading-tight truncate">
            <span className="font-bold text-[#D71921] uppercase">Tutorial: </span>
            <span className="text-zinc-200">
              {currentStepData.actionHint || `Enter reading and tap Save`}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleNext}
          className="px-2.5 py-1 text-[10px] font-black bg-[#D71921] text-white rounded-full uppercase tracking-wider shrink-0 active:scale-95"
        >
          {isLastStep ? 'Done' : 'Next'}
        </button>
      </div>
    );
  }

  // Dynamic card positioning so the coachmark NEVER overlaps the target element
  const getCardStyle = (): React.CSSProperties => {
  const isDesktop = typeof window === 'undefined' || window.innerWidth >= 850 || window.innerWidth === 0;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;

    const cardMaxWidth = Math.min(440, viewportWidth - 32);

    if (!targetRect) {
      return {
        position: 'fixed',
        bottom: isDesktop ? '24px' : '88px',
        left: isDesktop ? '24px' : '10px',
        right: isDesktop ? 'auto' : '10px',
        maxWidth: `${cardMaxWidth}px`,
        width: isDesktop ? `${cardMaxWidth}px` : 'calc(100vw - 20px)',
      };
    }

    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    if (isDesktop) {
      // Side-by-side mode (Desktop / Laptop / Tablet Landscape):
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
      // Mobile Single-Column Mode:
      // Allow user manual override or auto-position
      let placeAtTop = false;

      if (userPositionOverride === 'top') {
        placeAtTop = true;
      } else if (userPositionOverride === 'bottom') {
        placeAtTop = false;
      } else {
        // Auto: If target is in lower 45% (or bottom console), dock at top (top: 48px).
        // If target is in upper 55%, dock at bottom (bottom: 88px).
        placeAtTop = targetCenterY >= viewportHeight * 0.55;
      }

      if (placeAtTop) {
        return {
          position: 'fixed',
          top: '48px',
          left: '10px',
          right: '10px',
          maxWidth: 'calc(100vw - 20px)',
          width: 'calc(100vw - 20px)',
        };
      } else {
        return {
          position: 'fixed',
          bottom: '88px',
          left: '10px',
          right: '10px',
          maxWidth: 'calc(100vw - 20px)',
          width: 'calc(100vw - 20px)',
        };
      }
    }
  };

  const isDesktop = typeof window === 'undefined' || window.innerWidth >= 850 || window.innerWidth === 0;
  const currentCardPos = getCardStyle().top ? 'top' : 'bottom';

  const handleToggleFlip = () => {
    setUserPositionOverride(currentCardPos === 'top' ? 'bottom' : 'top');
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
          className={`fixed pointer-events-none transition-all duration-100 ease-out z-[60] rounded-xl ring-4 ring-offset-2 ring-offset-black/70 animate-pulse ${
            isNothing
              ? 'ring-[#D71921] shadow-[0_0_22px_rgba(215,25,33,0.55)]'
              : 'ring-amber-400 dark:ring-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.6)]'
          }`}
          style={{
            top: `${Math.max(4, targetRect.top - 4)}px`,
            left: `${Math.max(4, targetRect.left - 4)}px`,
            width: `${Math.min(window.innerWidth - 8, targetRect.width + 8)}px`,
            height: `${targetRect.height + 8}px`,
          }}
        />
      )}

      {/* Floating Coachmark Card */}
      <div
        ref={cardRef}
        style={getCardStyle()}
        className={`z-[60] pointer-events-auto overflow-hidden transition-all duration-200 ease-out animate-in fade-in ${
          isNothing
            ? isDarkMode
              ? 'bg-[#111111] border border-zinc-800 text-white rounded-2xl shadow-2xl font-["Space_Mono"]'
              : 'bg-white border border-zinc-300 text-black rounded-2xl shadow-2xl font-["Space_Mono"]'
            : 'bg-white dark:bg-zinc-950 border-2 border-amber-500/80 rounded-2xl shadow-2xl'
        }`}
      >
        {/* ================= DESKTOP CARD VIEW ================= */}
        {isDesktop ? (
          <div>
            {/* Desktop Header */}
            <div className={`px-4 py-3 border-b flex items-center justify-between gap-3 ${
              isNothing
                ? isDarkMode
                  ? 'bg-black/60 border-zinc-800/80'
                  : 'bg-zinc-100/80 border-zinc-200'
                : 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 flex items-center justify-center font-bold shrink-0 ${
                  isNothing
                    ? 'rounded-full border border-zinc-700 bg-zinc-900 text-[#D71921]'
                    : 'rounded-xl bg-amber-500 text-black shadow-sm'
                }`}>
                  <StepIcon className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      isNothing
                        ? 'border border-zinc-700 bg-black text-white'
                        : 'bg-amber-500 text-black'
                    }`}>
                      Step {currentStepData.stepNumber} of {currentStepData.totalSteps}
                    </span>
                    <span className={`text-xs font-bold ${
                      isNothing
                        ? isDarkMode ? 'text-zinc-400 font-["Space_Mono"] uppercase' : 'text-zinc-600 font-["Space_Mono"] uppercase'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}>
                      {tutorialCategory || 'Tutorial'}
                    </span>
                  </div>
                  <h3 className={`text-sm sm:text-base font-black leading-tight ${
                    isNothing
                      ? 'uppercase tracking-tight text-white dark:text-white'
                      : 'text-zinc-900 dark:text-white'
                  }`}>
                    {currentStepData.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={onExitTutorial}
                className={`p-1.5 transition shrink-0 ${
                  isNothing
                    ? 'text-zinc-400 hover:text-white rounded-lg'
                    : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg'
                }`}
                title="Exit Tutorial"
                aria-label="Exit Tutorial"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Desktop Body Content */}
            <div className="p-4 sm:p-5 space-y-3">
              <p className={`text-xs sm:text-sm leading-relaxed ${
                isNothing
                  ? isDarkMode ? 'text-zinc-300 font-normal font-["Space_Mono"]' : 'text-zinc-800 font-normal font-["Space_Mono"]'
                  : 'text-zinc-700 dark:text-zinc-200 font-medium'
              }`}>
                {currentStepData.content}
              </p>

              {currentStepData.actionHint && (
                <div className={`p-2.5 sm:p-3 rounded-xl flex items-start gap-2 text-xs font-semibold ${
                  isNothing
                    ? isDarkMode
                      ? 'bg-zinc-950 border border-zinc-800 text-zinc-200 font-["Space_Mono"]'
                      : 'bg-zinc-100 border border-zinc-300 text-zinc-900 font-["Space_Mono"]'
                    : 'bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200'
                }`}>
                  <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${
                    isNothing ? 'text-[#D71921]' : 'text-amber-500'
                  }`} />
                  <div className="flex-1">{currentStepData.actionHint}</div>
                </div>
              )}

              {currentStepData.proTip && (
                <div className={`p-2.5 rounded-xl border text-[11px] ${
                  isNothing
                    ? isDarkMode
                      ? 'bg-black/60 border-zinc-800/80 text-zinc-400 font-["Space_Mono"]'
                      : 'bg-zinc-50 border-zinc-300 text-zinc-600 font-["Space_Mono"]'
                    : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}>
                  <span className={`font-bold ${
                    isNothing ? 'text-[#D71921]' : 'text-zinc-800 dark:text-zinc-200'
                  }`}>Tip: </span>
                  {currentStepData.proTip}
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 pt-1">
                {activeSteps.map((s, idx) => (
                  <div
                    key={s.id}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      idx === currentStep
                        ? isNothing
                          ? 'w-6 bg-[#D71921]'
                          : 'w-6 bg-amber-500'
                        : idx < currentStep
                        ? isNothing
                          ? 'w-2 bg-[#4A9E5C]'
                          : 'w-2 bg-emerald-500'
                        : 'w-2 bg-zinc-300 dark:bg-zinc-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Desktop Footer */}
            <div className={`px-4 py-3 border-t flex items-center justify-between gap-2 ${
              isNothing
                ? isDarkMode
                  ? 'bg-black/80 border-zinc-800/80'
                  : 'bg-zinc-100 border-zinc-200'
                : 'bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800'
            }`}>
              <button
                type="button"
                onClick={onExitTutorial}
                className={`text-xs font-semibold px-2 py-1.5 rounded-lg transition ${
                  isNothing
                    ? 'font-["Space_Mono"] uppercase tracking-wider text-zinc-500 hover:text-white'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Exit Tutorial
              </button>

              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={onPrevStep}
                    className={`px-3 py-2 text-xs font-bold transition flex items-center gap-1 ${
                      isNothing
                        ? 'border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white rounded-lg font-["Space_Mono"] uppercase'
                        : 'rounded-xl text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className={`px-4 py-2 text-xs font-black active:scale-95 transition shadow-sm flex items-center gap-1.5 ${
                    isNothing
                      ? 'border border-[#D71921] bg-[#D71921] hover:bg-[#b5141b] text-white rounded-lg font-["Space_Mono"] uppercase tracking-wider'
                      : 'rounded-xl text-black bg-amber-500 hover:bg-amber-400'
                  }`}
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
        ) : (
          /* ================= MOBILE COMPACT ACTION HUD ================= */
          /* Ultra-compact (~115px) non-intrusive layout that leaves 75%+ of screen clear */
          <div className="p-2.5 sm:p-3 space-y-2">
            {/* Mobile Header Row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-[10px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                  isNothing ? 'border border-[#D71921] text-[#D71921] bg-transparent' : 'bg-amber-500 text-black'
                }`}>
                  Step {currentStepData.stepNumber} of {currentStepData.totalSteps}
                </span>
                {tutorialCategory && (
                  <span className={`text-[10px] font-bold truncate hidden xs:inline ${
                    isNothing ? 'text-zinc-400 font-["Space_Mono"] uppercase' : 'text-amber-700 dark:text-amber-400'
                  }`}>
                    {tutorialCategory}
                  </span>
                )}
                <h3 className={`text-xs font-black truncate ${
                  isNothing ? 'uppercase text-white' : 'text-zinc-900 dark:text-white'
                }`}>
                  {currentStepData.title}
                </h3>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Flip Position Button (Top / Bottom) */}
                <button
                  type="button"
                  onClick={handleToggleFlip}
                  data-testid="tutorial-flip-btn"
                  className={`px-2 py-0.5 text-[10px] font-bold border transition flex items-center gap-1 ${
                    isNothing
                      ? 'rounded-md border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:text-white'
                      : 'rounded-lg border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                  }`}
                  title={currentCardPos === 'top' ? 'Move card to bottom' : 'Move card to top'}
                >
                  <ArrowUpDown className="w-3 h-3" />
                  <span>{currentCardPos === 'top' ? 'Down' : 'Up'}</span>
                </button>

                {/* Details Expander Toggle */}
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  data-testid="tutorial-details-toggle"
                  className={`p-1 text-xs border transition ${
                    showDetails
                      ? isNothing ? 'border-[#D71921] text-[#D71921] rounded-md' : 'bg-amber-500/20 text-amber-500 rounded-lg'
                      : isNothing ? 'border-zinc-700 text-zinc-400 hover:text-white rounded-md' : 'border-zinc-300 dark:border-zinc-700 text-zinc-500 rounded-lg'
                  }`}
                  title={showDetails ? 'Hide details' : 'Show background details'}
                >
                  {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
                </button>

                {/* Close Exit Button */}
                <button
                  type="button"
                  onClick={onExitTutorial}
                  className={`p-1 text-zinc-400 hover:text-white transition rounded-md`}
                  title="Exit Tutorial"
                  aria-label="Exit Tutorial"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Mobile Immediate Action Prompt (Primary focal point) */}
            <div className={`px-2.5 py-1.5 rounded-lg flex items-start gap-1.5 text-xs font-semibold leading-tight ${
              isNothing
                ? isDarkMode
                  ? 'bg-zinc-950 border border-zinc-800/80 text-zinc-100'
                  : 'bg-zinc-100 border border-zinc-200 text-zinc-900'
                : 'bg-amber-500/10 border border-amber-500/30 text-zinc-900 dark:text-amber-200'
            }`}>
              <Sparkles className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isNothing ? 'text-[#D71921]' : 'text-amber-500'}`} />
              <span className="text-[11px] sm:text-xs">
                {currentStepData.actionHint || currentStepData.content}
              </span>
            </div>

            {/* Collapsible Extended Theory & ProTip (Hidden by default to save 100% of viewport) */}
            {showDetails && (
              <div className={`p-2.5 rounded-xl space-y-2 border text-xs animate-in fade-in slide-in-from-top-1 ${
                isNothing
                  ? isDarkMode ? 'bg-black border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                  : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300'
              }`}>
                <p className="leading-relaxed text-[11px]">{currentStepData.content}</p>
                {currentStepData.proTip && (
                  <div className={`text-[10px] leading-relaxed pt-1 border-t ${
                    isNothing ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                  }`}>
                    <span className={`font-bold ${isNothing ? 'text-[#D71921]' : 'text-amber-500'}`}>Tip: </span>
                    {currentStepData.proTip}
                  </div>
                )}
              </div>
            )}

            {/* Mobile Controls & Dots Row */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={onPrevStep}
                  className={`px-2.5 py-1 text-[10px] font-bold transition flex items-center gap-1 ${
                    isNothing
                      ? 'border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white rounded-md uppercase font-["Space_Mono"]'
                      : 'rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <ChevronLeft className="w-3 h-3" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              {/* Progress Dots */}
              <div className="flex items-center gap-1">
                {activeSteps.map((s, idx) => (
                  <div
                    key={s.id}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      idx === currentStep
                        ? isNothing
                          ? 'w-4 bg-[#D71921]'
                          : 'w-4 bg-amber-500'
                        : idx < currentStep
                        ? isNothing
                          ? 'w-1.5 bg-[#4A9E5C]'
                          : 'w-1.5 bg-emerald-500'
                        : 'w-1.5 bg-zinc-300 dark:bg-zinc-700'
                    }`}
                  />
                ))}
              </div>

              {/* Hero Action Key (Next / Finish) */}
              <button
                type="button"
                onClick={handleNext}
                className={`px-3 py-1.5 text-xs font-black transition active:scale-95 flex items-center gap-1 shadow-sm ${
                  isNothing
                    ? 'border border-[#D71921] bg-[#D71921] hover:bg-[#b5141b] text-white rounded-md uppercase text-[10px] tracking-wider font-["Space_Mono"]'
                    : 'rounded-xl text-black bg-amber-500 hover:bg-amber-400 text-xs'
                }`}
              >
                <span>{isLastStep ? 'Finish Tutorial' : 'Next Step'}</span>
                {isLastStep ? (
                  <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                ) : (
                  <ChevronRight className="w-3 h-3 stroke-[2.5]" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
