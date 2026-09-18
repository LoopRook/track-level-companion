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
  prototypeStyle?: string;
  isDarkMode?: boolean;
  onClose: () => void;
  onStartTutorial: () => void;
  onExploreDemo: () => void;
  onStartBlankTrack: () => void;
}

export const FirstTimeWelcomeModal: React.FC<FirstTimeWelcomeModalProps> = ({
  isOpen,
  prototypeStyle = 'original',
  isDarkMode = true,
  onClose,
  onStartTutorial,
  onExploreDemo,
  onStartBlankTrack,
}) => {
  useBodyScrollLock(isOpen);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  if (!isOpen) return null;

  const isNothing = prototypeStyle === 'nothing';

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
        className={`border w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] overscroll-contain touch-auto transition-colors animate-in fade-in zoom-in-95 duration-150 ${
          isNothing
            ? isDarkMode
              ? 'bg-[#0a0a0a] border-zinc-800 text-white rounded-2xl font-["Space_Mono"]'
              : 'bg-white border-zinc-300 text-black rounded-2xl font-["Space_Mono"]'
            : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`px-4 sm:px-5 py-3.5 flex items-center justify-between border-b shrink-0 ${
          isNothing
            ? isDarkMode
              ? 'bg-black border-zinc-800'
              : 'bg-zinc-100 border-zinc-200'
            : 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/20'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 flex items-center justify-center font-black shrink-0 ${
              isNothing
                ? 'rounded-full border border-zinc-700 bg-zinc-900 text-[#D71921]'
                : 'rounded-xl bg-amber-500 text-black shadow-sm'
            }`}>
              <Compass className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  isNothing ? 'text-[#D71921] font-["Space_Mono"]' : 'text-amber-600 dark:text-amber-400'
                }`}>
                  Getting Started
                </span>
              </div>
              <h2 className={`text-sm sm:text-base font-black truncate leading-tight ${
                isNothing ? 'uppercase font-["Space_Mono"]' : 'text-zinc-900 dark:text-white'
              }`}>
                Welcome to Track Level Companion
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className={`p-1.5 transition shrink-0 ${
              isNothing
                ? 'rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900'
                : 'rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }`}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto min-h-0">
          <p className={`text-xs leading-relaxed ${
            isNothing
              ? isDarkMode ? 'text-zinc-300 font-normal' : 'text-zinc-700 font-normal'
              : 'text-zinc-600 dark:text-zinc-300'
          }`}>
            The field-tested tool for miniature railroad and live steam track crews to survey rail elevations, spot sags and humps, and calculate exact jacking/shimming amounts.
          </p>

          <div className="space-y-2.5">
            {/* OPTION 1: Interactive Tutorial (Recommended) */}
            <div
              onClick={() => handleOption(onStartTutorial)}
              className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 group ${
                isNothing
                  ? isDarkMode
                    ? 'border-[#D71921] bg-[#D71921]/10 hover:bg-[#D71921]/15 text-white'
                    : 'border-[#D71921] bg-red-50 hover:bg-red-100 text-black'
                  : 'border-2 border-amber-500 bg-amber-500/10 hover:bg-amber-500/15 text-zinc-900 dark:text-white'
              }`}
            >
              <div className={`w-9 h-9 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition shadow-sm ${
                isNothing
                  ? 'rounded-full bg-[#D71921] text-white'
                  : 'rounded-xl bg-amber-500 text-black'
              }`}>
                <Play className={`w-4 h-4 ${isNothing ? 'fill-white' : 'fill-black'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className={`text-xs sm:text-sm font-black ${
                    isNothing ? 'uppercase tracking-tight' : 'text-zinc-900 dark:text-white'
                  }`}>
                    Start Tutorial
                  </h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    isNothing
                      ? 'border border-[#D71921] text-[#D71921] bg-transparent text-[9px] uppercase'
                      : 'bg-amber-500 text-black'
                  }`}>
                    Recommended
                  </span>
                </div>
                <p className={`text-[11px] mt-1 leading-relaxed ${
                  isNothing
                    ? isDarkMode ? 'text-zinc-300' : 'text-zinc-600'
                    : 'text-zinc-600 dark:text-zinc-300'
                }`}>
                  Interactive walkthrough: set a reference benchmark, shoot ties, read profile curves, and verify leveling.
                </p>
              </div>
            </div>

            {/* OPTION 2: Explore Sample Track */}
            <div
              onClick={() => handleOption(onExploreDemo)}
              className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                isNothing
                  ? isDarkMode
                    ? 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 text-zinc-200'
                    : 'border-zinc-300 bg-zinc-100 hover:border-zinc-400 text-zinc-900'
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className={`w-9 h-9 flex items-center justify-center shrink-0 mt-0.5 ${
                isNothing
                  ? 'rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300'
                  : 'rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
              }`}>
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-xs sm:text-sm font-bold ${
                  isNothing ? 'uppercase tracking-tight text-white dark:text-white' : 'text-zinc-900 dark:text-white'
                }`}>
                  Explore Sample Track (85ft Demo)
                </h4>
                <p className={`text-[11px] mt-1 leading-relaxed ${
                  isNothing
                    ? isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}>
                  Open the pre-loaded 18-station demo section to click around and inspect graphs, keypad, and settings at your own pace.
                </p>
              </div>
            </div>

            {/* OPTION 3: Start Blank Survey */}
            <div
              onClick={() => handleOption(onStartBlankTrack)}
              className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                isNothing
                  ? isDarkMode
                    ? 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 text-zinc-200'
                    : 'border-zinc-300 bg-zinc-100 hover:border-zinc-400 text-zinc-900'
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className={`w-9 h-9 flex items-center justify-center shrink-0 mt-0.5 ${
                isNothing
                  ? 'rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300'
                  : 'rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
              }`}>
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-xs sm:text-sm font-bold ${
                  isNothing ? 'uppercase tracking-tight text-white dark:text-white' : 'text-zinc-900 dark:text-white'
                }`}>
                  Start Blank Field Survey
                </h4>
                <p className={`text-[11px] mt-1 leading-relaxed ${
                  isNothing
                    ? isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}>
                  Already know what to do? Start a clean track starting at Station 0 and begin surveying right away.
                </p>
              </div>
            </div>
          </div>

          {/* Dismissal Checkbox */}
          <div className={`pt-2 flex items-center gap-2 border-t ${
            isNothing
              ? isDarkMode ? 'border-zinc-800/80' : 'border-zinc-200'
              : 'border-zinc-200 dark:border-zinc-800/80'
          }`}>
            <input
              type="checkbox"
              id="dontShowWelcomeAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className={`w-4 h-4 rounded cursor-pointer ${
                isNothing ? 'accent-[#D71921]' : 'text-amber-500 focus:ring-amber-400 border-zinc-300 dark:border-zinc-700'
              }`}
            />
            <label
              htmlFor="dontShowWelcomeAgain"
              className={`text-xs cursor-pointer ${
                isNothing
                  ? isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Don't show this welcome screen on startup
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`px-4 sm:px-5 py-3 border-t flex items-center justify-between shrink-0 ${
          isNothing
            ? isDarkMode
              ? 'bg-black border-zinc-800'
              : 'bg-zinc-100 border-zinc-200'
            : 'bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800'
        }`}>
          <span className="text-[11px] text-zinc-500">
            Replay anytime from the <strong>Help (?)</strong> menu
          </span>
          <button
            type="button"
            onClick={handleDismiss}
            className={`text-xs font-bold transition ${
              isNothing
                ? 'rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white px-4 py-1.5 uppercase font-["Space_Mono"]'
                : 'px-3.5 py-1.5 rounded-xl text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            Skip to App
          </button>
        </div>
      </div>
    </div>
  );
};
