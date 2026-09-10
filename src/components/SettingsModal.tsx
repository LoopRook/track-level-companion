import React, { useState } from 'react';
import { TrackProject, UnitFormat } from '../core/types';
import { useBodyScrollLock } from '../core/useBodyScrollLock';
import { triggerAppUpdateCheck } from './UpdatePrompt';
import { APP_VERSION_LABEL } from '../core/version';
import { Settings, X, Check, RefreshCw, Sliders, Hash, ShieldCheck, Smartphone, Vibrate } from 'lucide-react';
import { triggerHaptic } from '../core/haptics';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: TrackProject;
  onChangeProject: (updated: Partial<TrackProject>) => void;
  mobileLayout?: 'tabbed' | 'stacked';
  onChangeMobileLayout?: (layout: 'tabbed' | 'stacked') => void;
  hapticsEnabled?: boolean;
  onChangeHapticsEnabled?: (enabled: boolean) => void;
}

const TOLERANCE_PRESETS = [
  { label: '1/32"', sub: '±0.031"', val: 0.03125 },
  { label: '1/16"', sub: '±0.062"', val: 0.0625 },
  { label: '0.05"', sub: '±0.050"', val: 0.05 },
  { label: '1/8"', sub: '±0.125"', val: 0.125 },
  { label: '1.0 mm', sub: '±0.039"', val: 0.03937 },
  { label: '2.0 mm', sub: '±0.079"', val: 0.07874 },
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
}) => {
  useBodyScrollLock(isOpen);

  const activeMobileLayout = mobileLayout ?? 'tabbed';
  const isHapticOn = hapticsEnabled ?? true;

  const [testPulseMsg, setTestPulseMsg] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'updated'>('idle');
  const [customTolerance, setCustomTolerance] = useState<string>(
    project.toleranceInches ? project.toleranceInches.toString() : '0.0625'
  );

  if (!isOpen) return null;

  const handleCheckUpdates = async () => {
    if (updateStatus === 'checking') return;
    setUpdateStatus('checking');
    try {
      const res = await triggerAppUpdateCheck();
      if (res === 'up_to_date') {
        setUpdateStatus('updated');
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
        <div className="bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-white px-4 sm:px-5 py-3.5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" />
            <h2 className="text-base sm:text-lg font-bold">Leveling & App Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-900 transition"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-6 overflow-y-auto modal-scroll-container text-xs">
          
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
              <Hash className="w-4 h-4 text-amber-500" />
              <span>Fraction Keypad Precision</span>
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
                    className={`p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/50'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm">{label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-500 stroke-[3]" />}
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
              <label className="text-zinc-900 dark:text-zinc-100 font-bold text-xs block">
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
              <label className="text-zinc-900 dark:text-zinc-100 font-bold text-xs block">
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
              <Smartphone className="w-4 h-4 text-amber-500" />
              <span>Mobile Layout Mode</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Choose how the checklist and profile graph are arranged on phones and small screens (screens under 1024px width).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChangeMobileLayout?.('tabbed')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  activeMobileLayout === 'tabbed'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-300 ring-1 ring-amber-500/50'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm">Tabbed View (Recommended)</span>
                  {activeMobileLayout === 'tabbed' && <Check className="w-4 h-4 text-amber-500 stroke-[3]" />}
                </div>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Separate tabs for Checklist and Profile Graph. Eliminates scrolling past the graph when taking rod shots.
                </span>
              </button>

              <button
                type="button"
                onClick={() => onChangeMobileLayout?.('stacked')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  activeMobileLayout === 'stacked'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-300 ring-1 ring-amber-500/50'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm">Stacked View</span>
                  {activeMobileLayout === 'stacked' && <Check className="w-4 h-4 text-amber-500 stroke-[3]" />}
                </div>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Single continuous column. Graph, alignment controls, and checklist table all on one scrollable page.
                </span>
              </button>
            </div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Section 5: Keypad Haptic Feedback */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-bold text-sm">
                <Vibrate className="w-4 h-4 text-amber-500" />
                <span>Keypad Haptic Feedback</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection', true);
                  setTestPulseMsg('Fired! (5ms tick)');
                  setTimeout(() => setTestPulseMsg(null), 1500);
                }}
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 transition px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 active:scale-95 cursor-pointer"
                title="Test how the soft keypad micro-tick feels on this device"
              >
                {testPulseMsg ?? 'Test Tap'}
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
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  isHapticOn
                    ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-300 ring-1 ring-amber-500/50'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm">Enabled (Default)</span>
                  {isHapticOn && <Check className="w-4 h-4 text-amber-500 stroke-[3]" />}
                </div>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Gentle mechanical tick when tapping keys or advancing stations. Checklists and navigation remain silent.
                </span>
              </button>

              <button
                type="button"
                onClick={() => onChangeHapticsEnabled?.(false)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  !isHapticOn
                    ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-300 ring-1 ring-amber-500/50'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm">Disabled</span>
                  {!isHapticOn && <Check className="w-4 h-4 text-amber-500 stroke-[3]" />}
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

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Section 6: App Version & PWA Offline Information */}
          <div className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                  Track Level Companion
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-400 font-extrabold px-1.5 py-0.5 rounded border border-amber-500/30">
                  {APP_VERSION_LABEL}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCheckUpdates}
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 transition flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${updateStatus === 'checking' ? 'animate-spin' : ''}`} />
                <span>
                  {updateStatus === 'checking'
                    ? 'Checking...'
                    : updateStatus === 'updated'
                    ? 'Up to Date ✓'
                    : 'Check for Updates'}
                </span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Precision miniature and ride-on railroad track leveling engine with laser datum compensation, smooth visual profile plotting, and trackside lift recommendations.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-100 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition shadow-sm active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
