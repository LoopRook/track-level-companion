import React, { useState, useEffect } from 'react';
import { TrackProject, UnitFormat, PrototypeStyle } from '../core/types';
import { useBodyScrollLock } from '../core/useBodyScrollLock';
import { triggerAppUpdateCheck, hasWaitingAppUpdate, applyAppUpdate } from './UpdatePrompt';
import { APP_VERSION_LABEL } from '../core/version';
import { Settings, Check, RefreshCw, Sliders, Hash, ShieldCheck, Smartphone, Vibrate, Palette, Moon, Sun, FlaskConical } from 'lucide-react';
import { triggerHaptic } from '../core/haptics';
import { STYLES_META } from './PrototypeLabBar';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: TrackProject;
  onChangeProject: (updated: Partial<TrackProject>) => void;
  mobileLayout?: 'bottom_nav' | 'tabbed' | 'stacked';
  onChangeMobileLayout?: (layout: 'bottom_nav' | 'tabbed' | 'stacked') => void;
  hapticsEnabled?: boolean;
  onChangeHapticsEnabled?: (enabled: boolean) => void;
  onStartTutorial?: () => void;
  onOpenGuideModal?: () => void;
  prototypeStyle?: PrototypeStyle;
  onChangePrototypeStyle?: (style: PrototypeStyle) => void;
  showPrototypeBar?: boolean;
  onChangeShowPrototypeBar?: (show: boolean) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onToggleMobilePreview?: () => void;
}

const TOLERANCE_PRESETS = [
  { label: '± 1/16"', sub: '0.0625" (Strict / Mainline)', val: 0.0625 },
  { label: '± 1/8"', sub: '0.1250" (Standard Yard)', val: 0.125 },
  { label: '± 1/4"', sub: '0.2500" (Rough Siding)', val: 0.25 },
  { label: '± 1/2"', sub: '0.5000" (Coarse Rough)', val: 0.5 },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  project,
  onChangeProject,
  mobileLayout,
  onChangeMobileLayout,
  hapticsEnabled,
  onChangeHapticsEnabled,
  onStartTutorial,
  onOpenGuideModal,
  prototypeStyle = 'nothing',
  onChangePrototypeStyle,
  showPrototypeBar,
  onChangeShowPrototypeBar,
  isDarkMode = true,
  onToggleDarkMode,
  onToggleMobilePreview,
}) => {
  useBodyScrollLock(isOpen);

  const activeMobileLayout = mobileLayout ?? 'bottom_nav';
  const isHapticOn = hapticsEnabled ?? true;
  const isNothing = prototypeStyle === 'nothing';

  const [testPulseMsg, setTestPulseMsg] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'updated' | 'available' | 'installing' | 'offline'>('idle');
  const [customTolerance, setCustomTolerance] = useState<string>(
    project.toleranceInches ? project.toleranceInches.toString() : '0.0625'
  );

  // Android-style 9-tap Developer Options trigger
  const [devModeUnlocked, setDevModeUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('tlc_dev_mode_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  const [, setDevTapCount] = useState<number>(0);
  const [devToast, setDevToast] = useState<string | null>(null);

  const handleVersionTap = () => {
    if (devModeUnlocked) {
      setDevToast('Developer options already active.');
      setTimeout(() => setDevToast(null), 2500);
      return;
    }
    triggerHaptic('selection', true);
    setDevTapCount(prev => {
      const nextCount = prev + 1;
      if (nextCount >= 9) {
        setDevModeUnlocked(true);
        try {
          localStorage.setItem('tlc_dev_mode_unlocked', 'true');
        } catch {}
        setDevToast('You are now a developer! 🛠️');
        setTimeout(() => setDevToast(null), 3500);
      } else if (nextCount >= 5) {
        const remaining = 9 - nextCount;
        setDevToast(`You are now ${remaining} step${remaining === 1 ? '' : 's'} away from being a developer.`);
        setTimeout(() => setDevToast(null), 2000);
      }
      return nextCount;
    });
  };

  const handleLockDevOptions = () => {
    setDevModeUnlocked(false);
    setDevTapCount(0);
    try {
      localStorage.removeItem('tlc_dev_mode_unlocked');
    } catch {}
    onChangeShowPrototypeBar?.(false);
    onChangePrototypeStyle?.('nothing');
    setDevToast('Developer options locked and hidden.');
    setTimeout(() => setDevToast(null), 2500);
  };

  useEffect(() => {
    if (isOpen) {
      hasWaitingAppUpdate().then((waiting) => {
        if (waiting) setUpdateStatus('available');
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleAvailable = () => setUpdateStatus('available');
    window.addEventListener('tlc-update-available', handleAvailable);
    return () => window.removeEventListener('tlc-update-available', handleAvailable);
  }, []);

  if (!isOpen) return null;

  const handleCheckUpdates = async () => {
    if (updateStatus === 'checking' || updateStatus === 'installing') return;

    if (updateStatus === 'available') {
      setUpdateStatus('installing');
      await applyAppUpdate();
      return;
    }

    setUpdateStatus('checking');
    try {
      const res = await triggerAppUpdateCheck();
      if (res === 'update_found') {
        setUpdateStatus('available');
      } else if (res === 'up_to_date') {
        setUpdateStatus('updated');
        setTimeout(() => setUpdateStatus('idle'), 3000);
      } else if (res === 'offline') {
        setUpdateStatus('offline');
        setTimeout(() => setUpdateStatus('idle'), 3000);
      } else {
        setUpdateStatus('idle');
      }
    } catch {
      setUpdateStatus('idle');
    }
  };

  const currentTol = project.toleranceInches ?? 0.0625;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overscroll-none touch-none"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] overscroll-contain touch-auto transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white px-3.5 sm:px-5 py-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Settings className="w-5 h-5 text-[#D71921] shrink-0" />
            <h2 className="text-xs sm:text-base font-bold font-['Space_Mono'] uppercase tracking-wider whitespace-nowrap truncate">
              <span className="inline sm:hidden">[ SETTINGS ]</span>
              <span className="hidden sm:inline">[ LEVELING & APP SETTINGS ]</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-500 font-['Space_Mono'] uppercase tracking-wider text-[11px] font-bold transition cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center justify-center select-none"
            aria-label="Close Settings"
          >
            [ Close ]
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-6 overflow-y-auto modal-scroll-container text-xs">
          
          {/* Section: Appearance */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-bold text-sm">
                <Palette className={`w-4 h-4 ${isNothing ? 'text-[#D71921]' : 'text-amber-500'}`} />
                <span className={`whitespace-nowrap ${isNothing ? "font-['Space_Mono'] uppercase tracking-wider text-xs sm:text-sm" : ''}`}>
                  {isNothing ? '[ Appearance & Theme ]' : 'Appearance & Theme'}
                </span>
              </div>
              {onToggleDarkMode && (
                <button
                  type="button"
                  onClick={onToggleDarkMode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs font-['Space_Mono'] uppercase tracking-wider transition hover:border-zinc-400 dark:hover:border-zinc-500 active:scale-95 cursor-pointer"
                >
                  {isDarkMode ? (
                    <>
                      <Moon className="w-3.5 h-3.5 text-amber-400" />
                      <span>Dark Mode</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Light Mode</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>Nothing OS</span>
                  <span className="text-[9px] bg-red-500/20 text-[#D71921] font-bold px-1.5 py-0.2 rounded border border-red-500/30 font-['Space_Mono'] uppercase tracking-wider">
                    Production Active
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  Official hardware-inspired telemetry design with Space Grotesk/Mono typography, dot-matrix grid, and high-contrast rail leveling readouts.
                </p>
              </div>
            </div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />
          
          {/* Section 1: Grade Margin / On-Grade Tolerance */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-bold text-sm">
              <Sliders className="w-4 h-4 text-emerald-500" />
              <span>Leveling Margin (On-Grade Tolerance)</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              When a tie's calculated lift is within this margin, it is considered <strong>ON GRADE ✓</strong> in green, suppressing unnecessary shim/tamp action recommendations.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TOLERANCE_PRESETS.map((p) => {
                const isMatch = Math.abs(currentTol - p.val) < 0.002;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      onChangeProject({ toleranceInches: p.val });
                      setCustomTolerance(p.val.toString());
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      isMatch
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/50'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm">{p.label}</span>
                      {isMatch && <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono mt-0.5">{p.sub}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom decimal input */}
            <div className="flex items-center gap-2 p-2.5 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-500 whitespace-nowrap text-[11px]">Custom Margin:</span>
              <input
                type="number"
                step="0.001"
                min="0.005"
                max="1.0"
                value={customTolerance}
                onChange={(e) => {
                  setCustomTolerance(e.target.value);
                  const parsed = parseFloat(e.target.value);
                  if (!isNaN(parsed) && parsed > 0) {
                    onChangeProject({ toleranceInches: parsed });
                  }
                }}
                className="w-24 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 outline-none"
              />
              <span className="text-zinc-400 font-bold">inches</span>
              <span className="text-[10px] text-zinc-400 ml-auto hidden sm:inline">
                Active: ±{currentTol.toFixed(3)}"
              </span>
            </div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Section 2: Fraction Keypad Precision */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-bold text-sm">
              <Hash className={`w-4 h-4 ${isNothing ? 'text-[#D71921]' : 'text-amber-500'}`} />
              <span className={isNothing ? "font-['Space_Mono'] uppercase tracking-wider text-xs sm:text-sm" : ''}>
                {isNothing ? '[ Fraction Keypad Precision ]' : 'Fraction Keypad Precision'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Controls the fractional increments and nudge buttons displayed on the trackside fraction keypad.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { res: 8 as const, label: '1/8"', sub: '±1/8" steps' },
                { res: 16 as const, label: '1/16"', sub: '±1/16" steps' },
                { res: 32 as const, label: '1/32"', sub: '±1/32" steps' },
              ].map(({ res, label, sub }) => {
                const isSelected = (project.fractionResolution ?? 16) === res;
                return (
                  <button
                    key={res}
                    type="button"
                    onClick={() => onChangeProject({ fractionResolution: res })}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? isNothing
                          ? 'border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white ring-1 ring-zinc-900/30 dark:ring-white/40 font-["Space_Mono"]'
                          : 'border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/50'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm">{label}</span>
                      {isSelected && <Check className={`w-3.5 h-3.5 stroke-[3] ${isNothing ? 'text-[#D71921] dark:text-[#D71921]' : 'text-amber-500'}`} />}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">{sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Section 3: Default Units & Spacing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={`text-zinc-900 dark:text-zinc-100 font-bold text-xs block ${isNothing ? "font-['Space_Mono'] uppercase tracking-wider" : ''}`}>
                Default Measurement Units:
              </label>
              <select
                value={project.unitFormat}
                onChange={(e) => onChangeProject({ unitFormat: e.target.value as UnitFormat })}
                className="w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-medium outline-none"
              >
                <option value="decimal_inches">Decimal Inches (e.g. 6.28")</option>
                <option value="inches_fraction">Fractional Inches (e.g. 6 1/4")</option>
                <option value="feet_inches_fraction">Feet & Inches (e.g. 1' 4 1/4")</option>
                <option value="metric_mm">Metric Millimeters (e.g. 150.0 mm)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className={`text-zinc-900 dark:text-zinc-100 font-bold text-xs block ${isNothing ? "font-['Space_Mono'] uppercase tracking-wider" : ''}`}>
                Default Station Interval:
              </label>
              <select
                value={project.stationIntervalFt || 5}
                onChange={(e) => onChangeProject({ stationIntervalFt: Number(e.target.value) })}
                className="w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-medium outline-none font-mono"
              >
                <option value={1}>1 ft (Extra fine spacing)</option>
                <option value={2}>2 ft</option>
                <option value={2.5}>2.5 ft</option>
                <option value={5}>5 ft (Standard spacing)</option>
                <option value={10}>10 ft (Long tangents)</option>
                <option value={15}>15 ft</option>
              </select>
            </div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Section 4: Mobile Screen Layout */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-bold text-sm">
              <Smartphone className={`w-4 h-4 ${isNothing ? 'text-[#D71921]' : 'text-amber-500'}`} />
              <span className={isNothing ? "font-['Space_Mono'] uppercase tracking-wider text-xs sm:text-sm" : ''}>
                {isNothing ? '[ Mobile Layout Mode ]' : 'Mobile Layout Mode'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Choose how the checklist and profile graph are arranged on phones and small screens (screens under 1024px width).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onChangeMobileLayout?.('bottom_nav')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  activeMobileLayout === 'bottom_nav'
                    ? isNothing
                      ? 'border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white ring-1 ring-zinc-900/30 dark:ring-white/40 font-["Space_Mono"]'
                      : 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-300 ring-1 ring-amber-500/50'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs sm:text-sm">Bottom Dock (Thumb Zone)</span>
                  {activeMobileLayout === 'bottom_nav' && (
                    <Check className={`w-4 h-4 stroke-[3] ${isNothing ? 'text-[#D71921]' : 'text-amber-500'}`} />
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Docked bottom navigation with contained station scrolling. UI never scrolls off-screen. (Recommended)
                </span>
              </button>

              <button
                type="button"
                onClick={() => onChangeMobileLayout?.('tabbed')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  activeMobileLayout === 'tabbed'
                    ? isNothing
                      ? 'border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white ring-1 ring-zinc-900/30 dark:ring-white/40 font-["Space_Mono"]'
                      : 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-300 ring-1 ring-amber-500/50'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs sm:text-sm">Segmented Tabs</span>
                  {activeMobileLayout === 'tabbed' && (
                    <Check className={`w-4 h-4 stroke-[3] ${isNothing ? 'text-[#D71921]' : 'text-amber-500'}`} />
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Standard top tab buttons switching between Checklist and Profile view.
                </span>
              </button>

              <button
                type="button"
                onClick={() => onChangeMobileLayout?.('stacked')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  activeMobileLayout === 'stacked'
                    ? isNothing
                      ? 'border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white ring-1 ring-zinc-900/30 dark:ring-white/40 font-["Space_Mono"]'
                      : 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-300 ring-1 ring-amber-500/50'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs sm:text-sm">Stacked Page Scroll</span>
                  {activeMobileLayout === 'stacked' && (
                    <Check className={`w-4 h-4 stroke-[3] ${isNothing ? 'text-[#D71921]' : 'text-amber-500'}`} />
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Original continuous page scroll. (Graph at top, table below).
                </span>
              </button>
            </div>

            {/* Desktop Mobile Simulator Launch Box */}
            {onToggleMobilePreview && (
              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 mt-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Test in Mobile Phone Simulator</div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Preview phone bottom dock & touch gestures without DevTools</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onToggleMobilePreview();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition cursor-pointer shrink-0"
                >
                  Launch Simulator
                </button>
              </div>
            )}
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Section 5: Keypad Haptic Feedback */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-bold text-sm">
                <Vibrate className={`w-4 h-4 ${isNothing ? 'text-[#D71921]' : 'text-amber-500'}`} />
                <span className={isNothing ? "font-['Space_Mono'] uppercase tracking-wider text-xs sm:text-sm" : ''}>
                  {isNothing ? '[ Keypad Haptic Feedback ]' : 'Keypad Haptic Feedback'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection', true);
                  setTestPulseMsg('Fired! (5ms tick)');
                  setTimeout(() => setTestPulseMsg(null), 1500);
                }}
                className={`text-[11px] font-bold transition px-2.5 py-1 rounded-lg border active:scale-95 cursor-pointer ${
                  isNothing
                    ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 font-["Space_Mono"] uppercase tracking-wider'
                    : 'text-amber-600 dark:text-amber-400 hover:text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/25'
                }`}
                title="Test how the soft keypad micro-tick feels on this device"
              >
                {testPulseMsg
                  ? isNothing ? `[ ${testPulseMsg} ]` : testPulseMsg
                  : isNothing ? '[ TEST TAP ]' : 'Test Tap'}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Provides ultra-soft physical micro-ticks (4–6ms) exclusively on the trackside numeric keypad for tactile entry confirmation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection', true);
                  onChangeHapticsEnabled?.(true);
                }}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  isHapticOn
                    ? isNothing
                      ? 'border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white ring-1 ring-zinc-900/30 dark:ring-white/40 font-["Space_Mono"]'
                      : 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-300 ring-1 ring-amber-500/50'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm">Enabled (Default)</span>
                  {isHapticOn && (
                    <Check className={`w-4 h-4 stroke-[3] ${isNothing ? 'text-[#D71921]' : 'text-amber-500'}`} />
                  )}
                </div>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Gentle mechanical tick when tapping keys or advancing stations. Checklists and navigation remain silent.
                </span>
              </button>

              <button
                type="button"
                onClick={() => onChangeHapticsEnabled?.(false)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  !isHapticOn
                    ? isNothing
                      ? 'border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white ring-1 ring-zinc-900/30 dark:ring-white/40 font-["Space_Mono"]'
                      : 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-300 ring-1 ring-amber-500/50'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm">Disabled</span>
                  {!isHapticOn && (
                    <Check className={`w-4 h-4 stroke-[3] ${isNothing ? 'text-[#D71921]' : 'text-amber-500'}`} />
                  )}
                </div>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Silent operation. Disables all keypad vibration.
                </span>
              </button>
            </div>

            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">
              Adheres to Apple HIG and Material Design keypad guidelines. Supported on Android (Chrome, Edge, Firefox). Apple iOS Safari does not support web vibration.
            </p>
          </div>

          {/* Section: Interactive Tutorial */}
          {onStartTutorial && (
            <div className={`p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border ${
              isNothing
                ? isDarkMode
                  ? 'bg-zinc-950/60 border-zinc-800'
                  : 'bg-zinc-100 border-zinc-300'
                : 'bg-amber-500/10 border-amber-500/30 rounded-2xl'
            }`}>
              <div>
                <h4 className={`font-bold text-xs whitespace-nowrap ${
                  isNothing
                    ? 'text-zinc-100 dark:text-white font-["Space_Mono"] uppercase tracking-wider'
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}>
                  {isNothing ? '[ Interactive Tutorials ]' : 'Tutorials'}
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Walk through benchmarks, rod readings, sags, leveling, and tolerance margins.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartTutorial();
                }}
                className={`proto-ignore self-start sm:self-auto px-3 py-1.5 text-xs font-bold transition shadow-xs whitespace-nowrap active:scale-95 shrink-0 cursor-pointer ${
                  isNothing
                    ? 'rounded-lg border border-[#D71921] bg-[#D71921] hover:bg-[#b5141b] text-white font-["Space_Mono"] uppercase tracking-wider'
                    : 'rounded-xl bg-amber-500 text-black hover:bg-amber-400'
                }`}
              >
                {isNothing ? '[ Start Tutorial ]' : 'Start Tutorial'}
              </button>
            </div>
          )}

          {/* Section: Field Guide & Handbook */}
          {onOpenGuideModal && (
            <div className={`p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border ${
              isNothing
                ? isDarkMode
                  ? 'bg-zinc-950/60 border-zinc-800'
                  : 'bg-zinc-100 border-zinc-300'
                : 'bg-sky-500/10 border-sky-500/30 rounded-2xl'
            }`}>
              <div>
                <h4 className={`font-bold text-xs whitespace-nowrap ${
                  isNothing
                    ? 'text-zinc-100 dark:text-white font-["Space_Mono"] uppercase tracking-wider'
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}>
                  {isNothing ? '[ Field Guide & Handbook ]' : 'Field Guide & Handbook'}
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Complete reference manual for laser setup, math, slope modes, and leveling tolerances.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGuideModal();
                }}
                className={`proto-ignore self-start sm:self-auto px-3 py-1.5 text-xs font-bold transition shadow-xs whitespace-nowrap active:scale-95 shrink-0 cursor-pointer ${
                  isNothing
                    ? 'rounded-lg border border-zinc-700 bg-zinc-900 text-white hover:border-zinc-500 font-["Space_Mono"] uppercase tracking-wider'
                    : 'rounded-xl bg-sky-500 text-white hover:bg-sky-400'
                }`}
              >
                {isNothing ? '[ Open Guide ]' : 'Open Guide'}
              </button>
            </div>
          )}

          {/* Section: Developer & Experimental Tools (Hidden unless unlocked via 9 taps on Version) */}
          {devModeUnlocked && (
            <>
              <hr className="border-zinc-200 dark:border-zinc-800" />
              <div className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-amber-500/40 dark:border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs font-['Space_Mono'] uppercase tracking-wider">
                      Developer & Experimental Options
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLockDevOptions}
                    className="text-[10px] font-['Space_Mono'] uppercase tracking-wider text-zinc-500 hover:text-red-500 transition border border-zinc-300 dark:border-zinc-800 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Lock & Hide
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                    Show Prototype Lab Bar (Top Banner)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection', true);
                      onChangeShowPrototypeBar?.(!showPrototypeBar);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      showPrototypeBar ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs ${
                        showPrototypeBar ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-1">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 block mb-2 font-['Space_Mono'] uppercase tracking-wider">
                    Archived Prototype Styles:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {STYLES_META.map((style) => {
                      const isSelected = prototypeStyle === style.id;
                      const IconComponent = style.icon;
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => {
                            triggerHaptic('selection', true);
                            onChangePrototypeStyle?.(style.id);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'border-amber-500 bg-amber-500/10 text-zinc-900 dark:text-white ring-1 ring-amber-500/50'
                              : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconComponent className={`w-4 h-4 ${isSelected ? 'text-amber-500' : 'text-zinc-500'}`} />
                              <span className="font-extrabold text-xs">{style.label}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-500 stroke-[3]" />}
                          </div>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
                            {style.inspiration}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Section 6: App Version & PWA Offline Information (Tap 9 times to unlock dev options) */}
          <div
            onClick={handleVersionTap}
            className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-700 transition select-none"
            title={devModeUnlocked ? 'Developer options active' : 'Tap 9 times to unlock Developer Options'}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <ShieldCheck className={`w-4 h-4 shrink-0 ${isNothing ? 'text-[#4A9E5C]' : 'text-emerald-500'}`} />
                <span className={`font-bold text-xs whitespace-nowrap ${isNothing ? 'font-["Space_Mono"] text-zinc-900 dark:text-zinc-100' : 'text-zinc-900 dark:text-zinc-100'}`}>
                  Track Level Companion
                </span>
                <span
                  className={
                    isNothing
                      ? 'text-[9px] font-["Space_Mono"] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 whitespace-nowrap'
                      : 'text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-400 font-extrabold px-1.5 py-0.5 rounded border border-amber-500/30 whitespace-nowrap'
                  }
                >
                  {APP_VERSION_LABEL}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCheckUpdates();
                }}
                className={
                  updateStatus === 'available'
                    ? (isNothing
                        ? 'self-start sm:self-auto px-3 py-1.5 bg-[#D71921] hover:bg-[#b5141b] text-white text-[10px] font-bold font-["Space_Mono"] uppercase tracking-wider rounded-lg transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm animate-pulse whitespace-nowrap'
                        : 'self-start sm:self-auto px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm animate-pulse whitespace-nowrap')
                    : (isNothing
                        ? 'self-start sm:self-auto px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-800 text-[10px] font-bold font-["Space_Mono"] uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:border-[#D71921] hover:text-[#D71921] transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap'
                        : 'self-start sm:self-auto px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-800 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap')
                }
              >
                <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${updateStatus === 'available' ? 'text-white' : (isNothing ? 'text-[#D71921]' : '')} ${updateStatus === 'checking' || updateStatus === 'installing' ? 'animate-spin' : ''}`} />
                <span>
                  {updateStatus === 'checking'
                    ? (isNothing ? '[ CHECKING... ]' : 'Checking...')
                    : updateStatus === 'installing'
                    ? (isNothing ? '[ RESTARTING... ]' : 'Restarting...')
                    : updateStatus === 'available'
                    ? (isNothing ? '[ UPDATE READY - RESTART ]' : 'Update Ready - Restart')
                    : updateStatus === 'updated'
                    ? (isNothing ? '[ UP TO DATE ✓ ]' : 'Up to Date ✓')
                    : updateStatus === 'offline'
                    ? (isNothing ? '[ OFFLINE ]' : 'Offline')
                    : (isNothing ? '[ CHECK FOR UPDATES ]' : 'Check for Updates')}
                </span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Precision miniature and ride-on railroad track leveling engine with laser datum compensation, smooth visual profile plotting, and trackside lift recommendations.
            </p>
          </div>

        </div>

        {/* Android-style Developer Toast */}
        {devToast && (
          <div className="px-4 py-2 bg-black/95 border-t border-b border-amber-500/60 text-amber-400 text-xs font-['Space_Mono'] uppercase tracking-wider text-center animate-in fade-in duration-150 shadow-xl shrink-0">
            {devToast}
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-zinc-100 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800 hover:border-zinc-500 font-['Space_Mono'] uppercase tracking-wider text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
          >
            [ Close ]
          </button>
        </div>
      </div>
    </div>
  );
};
