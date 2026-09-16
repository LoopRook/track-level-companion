import React, { useState } from 'react';
import {
  Compass,
  Play,
  Layers,
  Plus,
  X
} from 'lucide-react';
import { useBodyScrollLock } from '../core/useBodyScrollLock';

interface FirstTimeWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTutorial: () => void;
  onExploreDemo: () => void;
  onStartBlankTrack: () => void;
}

export const FirstTimeWelcomeModal: React.FC<FirstTimeWelcomeModalProps> = ({
  isOpen,
  onClose,
  onStartTutorial,
  onExploreDemo,
  onStartBlankTrack,
}) => {
  useBodyScrollLock(isOpen);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  if (!isOpen) return null;

  const handleDismiss = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('tlc_onboarding_dismissed', 'true');
      } catch (err) {
        console.error('Failed to save onboarding dismissal preference', err);
      }
    }
    onClose();
  };

  const handleOption = (action: () => void) => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('tlc_onboarding_dismissed', 'true');
      } catch (err) {
        console.error('Failed to save onboarding dismissal preference', err);
      }
    }
    action();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overscroll-none touch-none"
      onClick={handleDismiss}
    >
      <div
        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] overscroll-contain touch-auto transition-colors animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-amber-500/10 dark:bg-amber-500/15 px-4 sm:px-5 py-3.5 flex items-center justify-between border-b border-amber-500/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black shadow-sm shrink-0">
              <Compass className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Getting Started
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
                Welcome to Track Level Companion
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto min-h-0">
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            The field-tested tool for miniature railroad and live steam track crews to survey rail elevations, spot sags and humps, and calculate exact jacking/shimming amounts.
          </p>

          <div className="space-y-2.5">
            {/* OPTION 1: 90-Second Hands-On Tutorial (Recommended) */}
            <div
              onClick={() => handleOption(onStartTutorial)}
              className="p-3.5 rounded-xl border-2 border-amber-500 bg-amber-500/10 hover:bg-amber-500/15 cursor-pointer transition flex items-start gap-3 text-zinc-900 dark:text-white group"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-black flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition shadow-sm">
                <Play className="w-4 h-4 fill-black" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white">
                    Start 90-Second Practice Tutorial
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-black shrink-0">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
                  A hands-on guided run: set a reference benchmark, shoot a dipped tie, read the vertical profile curve, and jack the tie to green.
                </p>
              </div>
            </div>

            {/* OPTION 2: Explore Sample Track */}
            <div
              onClick={() => handleOption(onExploreDemo)}
              className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer transition flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                  Explore Sample Track (85ft Demo)
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Open the pre-loaded 18-station demo section to click around and inspect graphs, keypad, and settings at your own pace.
                </p>
              </div>
            </div>

            {/* OPTION 3: Start Blank Survey */}
            <div
              onClick={() => handleOption(onStartBlankTrack)}
              className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer transition flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                  Start Blank Field Survey
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Already know what to do? Start a clean track starting at Station 0 and begin surveying right away.
                </p>
              </div>
            </div>
          </div>

          {/* Dismissal Checkbox */}
          <div className="pt-2 flex items-center gap-2 border-t border-zinc-200 dark:border-zinc-800/80">
            <input
              type="checkbox"
              id="dontShowWelcomeAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 cursor-pointer"
            />
            <label
              htmlFor="dontShowWelcomeAgain"
              className="text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer"
            >
              Don't show this welcome screen on startup
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-5 py-3 bg-zinc-50 dark:bg-zinc-900/80 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-zinc-500">
            Replay anytime from the <strong>Help (?)</strong> menu
          </span>
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
          >
            Skip to App
          </button>
        </div>
      </div>
    </div>
  );
};
