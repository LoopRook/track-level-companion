import React, { useState } from 'react';
import {
  Compass,
  Play,
  Layers,
  Plus,
  Settings,
  Sun,
  Moon,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { useBodyScrollLock } from '../core/useBodyScrollLock';
import { TrackProject, UnitFormat, FractionResolution } from '../core/types';
import { triggerHaptic } from '../core/haptics';

export interface FirstTimeWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: TrackProject;
  onChangeProject?: (updated: Partial<TrackProject>) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onStartTutorial: () => void;
  onExploreDemo: () => void;
  onStartBlankTrack: () => void;
  onOpenSettings?: () => void;
  prototypeStyle?: string;
}

export const FirstTimeWelcomeModal: React.FC<FirstTimeWelcomeModalProps> = ({
  isOpen,
  onClose,
  project,
  onChangeProject,
  isDarkMode = true,
  onToggleDarkMode,
  onStartTutorial,
  onExploreDemo,
  onStartBlankTrack,
  onOpenSettings,
  prototypeStyle = 'nothing',
}) => {
  useBodyScrollLock(isOpen);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  const activeUnitFormat = project?.unitFormat ?? 'feet_inches_fraction';
  const activeFractionResolution = project?.fractionResolution ?? 16;

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

  const handleSelectUnit = (format: UnitFormat, resolution: FractionResolution) => {
    triggerHaptic('selection');
    onChangeProject?.({
      unitFormat: format,
      fractionResolution: resolution,
    });
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
        <div className={`px-4 sm:px-5 py-3.5 flex items-center justify-between border-b shrink-0 gap-2 ${
          isNothing
            ? isDarkMode
              ? 'bg-black border-zinc-800'
              : 'bg-zinc-100 border-zinc-200'
            : 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/20'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 flex items-center justify-center font-black shrink-0 ${
              isNothing
                ? 'rounded-lg border border-zinc-700 bg-zinc-900 text-[#D71921]'
                : 'rounded-xl bg-amber-500 text-black shadow-sm'
            }`}>
              <Compass className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${
                  isNothing ? 'text-[#D71921] font-["Space_Mono"]' : 'text-amber-600 dark:text-amber-400'
                }`}>
                  INITIAL CONFIGURATION
                </span>
              </div>
              <h2 className="text-xs sm:text-sm font-black truncate leading-tight uppercase font-['Space_Mono']">
                [ Quick Setup Guide ]
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white font-['Space_Mono'] uppercase tracking-wider text-[10px] font-bold transition cursor-pointer whitespace-nowrap shrink-0"
            aria-label="Close"
          >
            [ Close ]
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto modal-scroll-container text-xs min-h-0">
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Welcome to Track Level Companion. Configure your preferred field units and display mode before starting.
          </p>

          {/* STEP 1: Measurement Unit Format */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-['Space_Mono'] block">
              [ 1. Preferred Field Measurement Units ]
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectUnit('feet_inches_fraction', 16)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  activeUnitFormat === 'feet_inches_fraction' && activeFractionResolution === 16
                    ? 'border-[#D71921] bg-[#D71921]/10 text-zinc-900 dark:text-white ring-1 ring-[#D71921]/40'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:border-zinc-400 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs font-['Space_Mono']">Inches + 1/16"</span>
                  {activeUnitFormat === 'feet_inches_fraction' && activeFractionResolution === 16 && (
                    <Check className="w-3.5 h-3.5 text-[#D71921] stroke-[3]" />
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
                  6' 3 5/16" (Standard Track)
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectUnit('feet_inches_fraction', 8)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  activeUnitFormat === 'feet_inches_fraction' && activeFractionResolution === 8
                    ? 'border-[#D71921] bg-[#D71921]/10 text-zinc-900 dark:text-white ring-1 ring-[#D71921]/40'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:border-zinc-400 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs font-['Space_Mono']">Inches + 1/8"</span>
                  {activeUnitFormat === 'feet_inches_fraction' && activeFractionResolution === 8 && (
                    <Check className="w-3.5 h-3.5 text-[#D71921] stroke-[3]" />
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
                  6' 3 3/8" (Yard / Fast)
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectUnit('decimal_inches', 16)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  activeUnitFormat === 'decimal_inches'
                    ? 'border-[#D71921] bg-[#D71921]/10 text-zinc-900 dark:text-white ring-1 ring-[#D71921]/40'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:border-zinc-400 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs font-['Space_Mono']">Decimal Inches</span>
                  {activeUnitFormat === 'decimal_inches' && (
                    <Check className="w-3.5 h-3.5 text-[#D71921] stroke-[3]" />
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
                  6.28" (Surveyor Rod)
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectUnit('metric_mm', 16)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  activeUnitFormat === 'metric_mm'
                    ? 'border-[#D71921] bg-[#D71921]/10 text-zinc-900 dark:text-white ring-1 ring-[#D71921]/40'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:border-zinc-400 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs font-['Space_Mono']">Metric (mm)</span>
                  {activeUnitFormat === 'metric_mm' && (
                    <Check className="w-3.5 h-3.5 text-[#D71921] stroke-[3]" />
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
                  159.5 mm (International)
                </span>
              </button>
            </div>
          </div>

          {/* STEP 2: Display Theme */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-['Space_Mono'] block">
              [ 2. Display Mode & Contrast ]
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!isDarkMode && onToggleDarkMode) onToggleDarkMode();
                }}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                  isDarkMode
                    ? 'border-[#D71921] bg-[#D71921]/10 text-white ring-1 ring-[#D71921]/40'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:border-zinc-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-bold text-xs font-['Space_Mono']">Dark Mode</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">OLED / Field Night</div>
                  </div>
                </div>
                {isDarkMode && <Check className="w-3.5 h-3.5 text-[#D71921] stroke-[3]" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isDarkMode && onToggleDarkMode) onToggleDarkMode();
                }}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                  !isDarkMode
                    ? 'border-[#D71921] bg-[#D71921]/10 text-black ring-1 ring-[#D71921]/40'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:border-zinc-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="font-bold text-xs font-['Space_Mono']">Light Mode</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">Direct Sun / Daylight</div>
                  </div>
                </div>
                {!isDarkMode && <Check className="w-3.5 h-3.5 text-[#D71921] stroke-[3]" />}
              </button>
            </div>
          </div>

          {/* STEP 3: "Settings is a Thing" Feature Highlight */}
          <div className="p-2.5 sm:p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white font-['Space_Mono'] uppercase tracking-wider">
                <Settings className="w-3.5 h-3.5 text-[#D71921] shrink-0" />
                <span className="truncate">[ Settings Is Always Available ]</span>
              </div>
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={() => {
                    handleDismiss();
                    onOpenSettings();
                  }}
                  className="text-[10px] text-[#D71921] hover:underline font-bold font-['Space_Mono'] uppercase cursor-pointer whitespace-nowrap"
                >
                  [ Configure Now → ]
                </button>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              You can fine-tune leveling tolerance margins (±1/16", ±1/8"), laser datum reference modes, station intervals, and keypad haptic vibration anytime via <strong>[ ⚙ SETTINGS ]</strong> in the header or tools menu.
            </p>
          </div>

          {/* STEP 4: Launch Actions */}
          <div className="space-y-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-['Space_Mono'] block">
              [ 3. Select Where to Begin ]
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleOption(onStartTutorial)}
                className="w-full p-3 rounded-xl border border-[#D71921] bg-[#D71921]/15 hover:bg-[#D71921]/25 text-left transition cursor-pointer flex items-center justify-between gap-3 group active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#D71921] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Play className="w-3.5 h-3.5 fill-white" />
                  </div>
                  <div>
                    <div className="font-bold text-xs uppercase tracking-tight text-zinc-900 dark:text-white font-['Space_Mono']">
                      Start Interactive Tutorial
                    </div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Recommended: guided walkthrough of benchmarks, laser readings & leveling
                    </div>
                  </div>
                </div>
                <span className="text-[9px] font-bold font-['Space_Mono'] uppercase px-2 py-0.5 rounded border border-[#D71921] text-[#D71921] shrink-0">
                  RECOMMENDED
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleOption(onExploreDemo)}
                  className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:border-zinc-400 dark:hover:border-zinc-700 text-left transition cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs font-['Space_Mono'] uppercase text-zinc-900 dark:text-white">
                    <Layers className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Explore Demo</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">
                    85ft sample section
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleOption(onStartBlankTrack)}
                  className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:border-zinc-400 dark:hover:border-zinc-700 text-left transition cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs font-['Space_Mono'] uppercase text-zinc-900 dark:text-white">
                    <Plus className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Blank Track</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">
                    Fresh field survey
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Dismissal Checkbox */}
          <div className="pt-2 flex items-center gap-2 border-t border-zinc-200 dark:border-zinc-800">
            <input
              type="checkbox"
              id="dontShowWelcomeAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer accent-[#D71921]"
            />
            <label
              htmlFor="dontShowWelcomeAgain"
              className="text-xs cursor-pointer text-zinc-600 dark:text-zinc-400 font-['Space_Mono']"
            >
              Don't show this setup guide on startup
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`px-3 sm:px-5 py-3 border-t flex items-center justify-between gap-2 shrink-0 ${
          isNothing
            ? isDarkMode
              ? 'bg-black border-zinc-800'
              : 'bg-zinc-100 border-zinc-200'
            : 'bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800'
        }`}>
          <span className="text-[10px] text-zinc-500 font-['Space_Mono'] truncate">
            Reopen anytime from <strong>Help (?)</strong>
          </span>
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 sm:px-4 py-2 rounded-lg bg-[#D71921] hover:bg-[#b5141b] text-white text-xs font-bold font-['Space_Mono'] uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">[ Enter App ]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
