import React, { useState, useEffect, useMemo } from 'react';
import { UnitFormat, TrackProject, CalculatedStation, PrototypeStyle } from '../core/types';
import { calculateGradeInfo } from '../core/calculations';
import { Sliders, Sun, Moon, Compass, BookOpen, CheckCircle2, TrendingUp, Plus, Download, Settings, HelpCircle, Play } from 'lucide-react';
import { triggerAppUpdateCheck } from './UpdatePrompt';

export interface StationSummaryData {
  totalStations: number;
  measuredCount: number;
  completedCount?: number;
  onGradeCount: number;
  liftCount: number;
  lowerCount: number;
  maxLift: number;
  maxLower: number;
  lengthFt: number;
}

export interface StationConfigHeaderProps {
  project: TrackProject;
  onChangeProject: (updated: Partial<TrackProject>) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenDataModal: () => void;
  onOpenGuideModal: () => void;
  onOpenNewTrackModal: () => void;
  onOpenSettingsModal?: () => void;
  onStartTutorial?: () => void;
  onInstallApp?: () => void;
  canInstall?: boolean;
  summary: StationSummaryData;
  prototypeStyle?: PrototypeStyle;
  onToggleMobilePreview?: () => void;
  isMobilePreviewOpen?: boolean;
  isEmbedded?: boolean;
  onOpenToolsModal?: () => void;
}

export interface StationSummaryBarProps {
  project: TrackProject;
  summary: StationSummaryData;
  prototypeStyle?: PrototypeStyle;
}

export interface StationAlignmentBarProps {
  project: TrackProject;
  onChangeProject: (updated: Partial<TrackProject>) => void;
  calculatedStations?: CalculatedStation[];
  prototypeStyle?: PrototypeStyle;
}

export const StationConfigHeader: React.FC<StationConfigHeaderProps> = ({
  project,
  onChangeProject,
  isDarkMode,
  onToggleDarkMode,
  onOpenDataModal,
  onOpenGuideModal,
  onOpenNewTrackModal,
  onOpenSettingsModal,
  onStartTutorial,
  onInstallApp,
  canInstall,
  summary,
  prototypeStyle = 'original',
  onOpenToolsModal,
}) => {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'updated'>('idle');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCheckForUpdates = async () => {
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

  return (
    <header className="proto-card bg-white dark:bg-black text-zinc-900 dark:text-white rounded-2xl p-2.5 sm:p-3 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2.5 transition-colors">
      {/* Title & Theme Toggle Row */}
      <div className="flex items-center justify-between w-full gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`w-9 h-9 flex items-center justify-center shadow-sm shrink-0 ${
            prototypeStyle === 'nothing'
              ? 'bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-full'
              : 'rounded-xl bg-amber-500/20 dark:bg-amber-500/15 border border-amber-500/40 text-amber-500'
          }`}>
            <Compass className="w-4.5 h-4.5 stroke-[2]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={project.name}
                onChange={(e) => onChangeProject({ name: e.target.value })}
                className={`bg-transparent font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 focus:bg-zinc-100 dark:focus:bg-zinc-900 rounded px-1 -ml-1 py-0.5 outline-none transition w-full truncate ${
                  prototypeStyle === 'nothing' ? "font-['Space_Grotesk']" : ''
                }`}
                placeholder="Track Section Name"
                title="Click to rename track section"
              />
            </div>
            <div className={`flex items-center gap-2 text-[11px] font-medium truncate ${
              prototypeStyle === 'nothing' ? "font-['Space_Mono'] uppercase tracking-wider text-[10px] text-zinc-600 dark:text-zinc-400" : "text-zinc-400 dark:text-zinc-300"
            }`}>
              <span className="truncate">{prototypeStyle === 'nothing' ? `[ ${summary.lengthFt} FT SECTION ]` : `${summary.lengthFt} ft Section`}</span>
              <span>•</span>
              {!isOnline ? (
                <span
                  className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    prototypeStyle === 'nothing'
                      ? 'border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-full'
                      : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                  }`}
                  title="Offline mode: all changes persist in browser storage"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] inline-block" />
                  <span>Offline</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleCheckForUpdates}
                  className="flex items-center gap-1 text-[10px] text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition cursor-pointer whitespace-nowrap"
                  title="Service Worker active (offline ready). Tap to check for app updates."
                >
                  {prototypeStyle === 'nothing' ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4A9E5C] inline-block" />
                  ) : (
                    <CheckCircle2 className={`w-3 h-3 text-emerald-500 ${updateStatus === 'checking' ? 'animate-spin' : ''}`} />
                  )}
                  <span>
                    {updateStatus === 'checking'
                      ? 'Checking...'
                      : updateStatus === 'updated'
                      ? 'Up to Date ✓'
                      : 'Offline Ready'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Header Buttons: Help & Theme Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">

          {/* Mobile Tools Menu Launcher (hidden on desktop md+, visible on mobile phones) */}
          {onOpenToolsModal && (
            <button
              type="button"
              onClick={onOpenToolsModal}
              className={`md:hidden h-8 px-2 sm:px-2.5 flex items-center gap-1.5 transition active:scale-95 text-xs font-bold shrink-0 cursor-pointer ${
                prototypeStyle === 'nothing'
                  ? 'rounded-full border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white font-["Space_Mono"] uppercase tracking-wider'
                  : 'rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
              title="Open Field Tools & Settings Menu"
              aria-label="Open Field Tools"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Tools</span>
            </button>
          )}

          {/* Help / Field Guide Button (Available on both desktop and mobile) */}
          <button
            type="button"
            onClick={onOpenGuideModal}
            className={`proto-ignore h-8 w-8 flex items-center justify-center transition active:scale-95 shrink-0 cursor-pointer ${
              prototypeStyle === 'nothing'
                ? 'rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white font-["Space_Mono"]'
                : 'rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
            title="Field Guide & Handbook (?)"
            aria-label="Open Field Guide"
          >
            <HelpCircle className="w-4 h-4 text-[#D71921]" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            className={`h-8 w-8 flex items-center justify-center transition active:scale-95 text-zinc-700 dark:text-zinc-300 shrink-0 cursor-pointer ${
              prototypeStyle === 'nothing'
                ? 'rounded-full border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white'
                : 'rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
            }`}
            title={isDarkMode ? 'Switch to Bright Sunlight Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Sunlight Mode"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            )}
          </button>
        </div>
      </div>

      {/* Action Controls (Hidden on mobile phones to save vertical space; accessible via bottom dock or Tools button) */}
      <div data-tutorial="header-actions" className="hidden md:flex items-center gap-1.5 w-full flex-wrap">
        {/* Desktop / PWA Install Button */}
        {canInstall && onInstallApp && (
          <button
            type="button"
            onClick={onInstallApp}
            className={`flex-1 h-8 flex items-center justify-center gap-1 px-2 text-xs font-black transition active:scale-95 whitespace-nowrap cursor-pointer ${
              prototypeStyle === 'nothing'
                ? 'rounded-full bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-["Space_Mono"] uppercase tracking-wider'
                : 'rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm'
            }`}
            title="Install Track Level Companion as a standalone desktop app"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
            <span>Install</span>
          </button>
        )}

        {/* Start New Track */}
        <button
          type="button"
          onClick={onOpenNewTrackModal}
          className={`flex-1 h-8 flex items-center justify-center gap-1 px-2 text-xs font-black transition active:scale-95 whitespace-nowrap cursor-pointer ${
            prototypeStyle === 'nothing'
              ? 'rounded-full bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-["Space_Mono"] uppercase tracking-wider'
              : 'rounded-xl bg-amber-500 hover:bg-amber-400 text-black shadow-sm'
          }`}
          title="Start New Track (Blank, Pre-Generated Grid, or Clear Readings)"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3] shrink-0" />
          <span>New</span>
        </button>

        {/* Interactive Step-by-Step Tutorials */}
        {onStartTutorial && (
          <button
            type="button"
            onClick={onStartTutorial}
            className={`flex-1 h-8 flex items-center justify-center gap-1.5 px-2 text-xs font-bold transition active:scale-95 whitespace-nowrap cursor-pointer ${
              prototypeStyle === 'nothing'
                ? 'rounded-full bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:border-zinc-900 dark:hover:border-zinc-400 font-["Space_Mono"] uppercase tracking-wider'
                : 'rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 border border-amber-500/30'
            }`}
            title="Open Interactive Step-by-Step Field Walkthroughs"
          >
            <Play className={`w-3.5 h-3.5 shrink-0 ${prototypeStyle === 'nothing' ? 'text-[#D71921] fill-[#D71921]' : 'text-amber-500 fill-amber-500'}`} />
            <span>Tutorials</span>
          </button>
        )}

        {/* Field Guide & Reference Handbook */}
        <button
          type="button"
          onClick={onOpenGuideModal}
          className={`flex-1 h-8 flex items-center justify-center gap-1.5 px-2 text-xs font-bold transition active:scale-95 whitespace-nowrap cursor-pointer ${
            prototypeStyle === 'nothing'
              ? 'rounded-full bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:border-zinc-900 dark:hover:border-zinc-400 font-["Space_Mono"] uppercase tracking-wider'
              : 'rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 border border-amber-500/30'
          }`}
          title="Open Field Guide, Laser Principles & Math Handbook"
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span>Guide</span>
        </button>

        {/* Data / Files */}
        <button
          type="button"
          onClick={onOpenDataModal}
          data-tutorial="header-files-btn"
          className={`flex-1 h-8 flex items-center justify-center gap-1 px-2 text-xs font-bold transition active:scale-95 whitespace-nowrap ${
            prototypeStyle === 'nothing'
              ? 'rounded-full bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:border-zinc-900 dark:hover:border-zinc-400 font-["Space_Mono"] uppercase tracking-wider'
              : 'rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 shrink-0" />
          <span>Files</span>
        </button>

        {/* Settings */}
        {onOpenSettingsModal && (
          <button
            type="button"
            onClick={onOpenSettingsModal}
            className={`flex-1 h-8 flex items-center justify-center gap-1 px-2 text-xs font-bold transition active:scale-95 whitespace-nowrap ${
              prototypeStyle === 'nothing'
                ? 'rounded-full bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:border-zinc-900 dark:hover:border-zinc-400 font-["Space_Mono"] uppercase tracking-wider'
                : 'rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800'
            }`}
            title="Open App Settings (Grade Tolerance, Keypad Resolution, Default Units)"
          >
            <Settings className="w-3.5 h-3.5 shrink-0" />
            <span>Settings</span>
          </button>
        )}
      </div>
    </header>
  );
};

const getToleranceLabel = (tol?: number, unit?: UnitFormat) => {
  const t = tol ?? 0.0625;
  if (Math.abs(t - 0.03125) < 0.001) return '±1/32"';
  if (Math.abs(t - 0.0625) < 0.001) return '±1/16"';
  if (Math.abs(t - 0.125) < 0.001) return '±1/8"';
  if (Math.abs(t - 0.05) < 0.001) return '±0.05"';
  if (Math.abs(t - 0.03937) < 0.001) return '±1.0mm';
  if (Math.abs(t - 0.07874) < 0.001) return '±2.0mm';
  if (unit === 'metric_mm') return `±${(t * 25.4).toFixed(1)}mm`;
  if (unit === 'decimal_inches') return `±${t.toFixed(2)}"`;
  return `±${t.toFixed(3)}"`;
};

export const StationSummaryBar: React.FC<StationSummaryBarProps> = ({ project, summary, prototypeStyle = 'original' }) => {
  if (prototypeStyle === 'nothing') {
    return (
      <div className="rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-[#000000] overflow-hidden shadow-xs divide-y divide-zinc-200 dark:divide-zinc-800">
        <div className="grid grid-cols-2 divide-x divide-zinc-200 dark:divide-zinc-800">
          {/* Cell 1: Track Length */}
          <div className="p-2.5 sm:p-3 flex flex-col justify-between min-h-[74px] sm:min-h-[78px]">
            <div className="min-h-[22px] flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] sm:text-[11px] font-bold font-['Space_Mono'] uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">
                [ TRACK LENGTH ]
              </span>
              {summary.completedCount !== undefined && summary.completedCount > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.2 rounded border border-[#4A9E5C]/40 text-[#4A9E5C] font-mono whitespace-nowrap shrink-0"
                  title={`${summary.completedCount} of ${summary.totalStations} ties completed trackside`}
                >
                  ✓ {summary.completedCount}/{summary.totalStations}
                </span>
              )}
            </div>
            <div className="mt-auto pt-1 flex items-baseline flex-wrap gap-x-1.5">
              <span className="font-['Doto'] font-bold text-2xl sm:text-3xl text-zinc-900 dark:text-white tracking-tight">
                {summary.lengthFt}
              </span>
              <span className="text-[11px] font-normal whitespace-nowrap font-['Space_Mono'] text-zinc-500 uppercase">
                FT ({summary.measuredCount}/{summary.totalStations} shot)
              </span>
            </div>
          </div>

          {/* Cell 2: On Grade */}
          <div className="p-2.5 sm:p-3 flex flex-col justify-between min-h-[74px] sm:min-h-[78px]">
            <div className="min-h-[22px] flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] sm:text-[11px] font-bold font-['Space_Mono'] uppercase tracking-[0.08em] text-[#2E7D32] dark:text-[#4A9E5C] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] dark:bg-[#4A9E5C] shrink-0 inline-block"></span>
                [ ON GRADE ({getToleranceLabel(project.toleranceInches, project.unitFormat)}) ]
              </span>
            </div>
            <div className="mt-auto pt-1 flex items-baseline flex-wrap gap-x-2">
              <span className="font-['Doto'] font-bold text-2xl sm:text-3xl text-[#2E7D32] dark:text-[#4A9E5C] tracking-tight">
                {summary.measuredCount >= 2
                  ? `${Math.round((summary.onGradeCount / summary.measuredCount) * 100)}%`
                  : '—'}
              </span>
              <span className="text-[11px] font-semibold whitespace-nowrap font-['Space_Mono'] text-[#2E7D32]/80 dark:text-[#4A9E5C]/80 uppercase">
                {summary.measuredCount < 2 ? '(Need ≥ 2)' : `(${summary.onGradeCount} pts)`}
              </span>
            </div>
            {summary.measuredCount >= 2 && (
              <div className="flex gap-1 w-full mt-2">
                {Array.from({ length: 10 }).map((_, i) => {
                  const percent = Math.round((summary.onGradeCount / summary.measuredCount) * 100);
                  const isFilled = i < Math.round(percent / 10);
                  return (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-none transition-colors ${
                        isFilled
                          ? 'bg-[#2E7D32] dark:bg-[#4A9E5C]'
                          : 'bg-zinc-200 dark:bg-[#262626]'
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-zinc-200 dark:divide-zinc-800">
          {/* Cell 3: Needs Lift */}
          <div className="p-2.5 sm:p-3 flex flex-col justify-between min-h-[74px] sm:min-h-[78px]">
            <div className="min-h-[22px] flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] sm:text-[11px] font-bold font-['Space_Mono'] uppercase tracking-[0.08em] text-[#1D4ED8] dark:text-[#5B9BF6] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8] dark:bg-[#5B9BF6] shrink-0 inline-block"></span>
                [ NEEDS LIFT ]
              </span>
            </div>
            <div className="mt-auto pt-1 flex items-baseline flex-wrap gap-x-2">
              <span className="font-['Doto'] font-bold text-2xl sm:text-3xl text-[#1D4ED8] dark:text-[#5B9BF6] tracking-tight">
                {summary.measuredCount >= 2 ? summary.liftCount : '—'}
              </span>
              <span className="text-[11px] font-semibold whitespace-nowrap font-['Space_Mono'] text-[#1D4ED8]/80 dark:text-[#5B9BF6]/80 uppercase">
                {summary.measuredCount >= 2 && summary.maxLift > 0 ? (
                  `(Max +${project.unitFormat === 'decimal_inches'
                    ? `${summary.maxLift.toFixed(2)}"`
                    : project.unitFormat === 'metric_mm'
                    ? `${(summary.maxLift * 25.4).toFixed(1)}mm`
                    : project.fractionResolution === 16
                    ? `${Math.round(summary.maxLift * 16)}/16"`
                    : `${summary.maxLift.toFixed(2)}"`})`
                ) : summary.measuredCount < 2 ? (
                  '(Need ≥ 2)'
                ) : (
                  'pts'
                )}
              </span>
            </div>
          </div>

          {/* Cell 4: Needs Lower */}
          <div className="p-2.5 sm:p-3 flex flex-col justify-between min-h-[74px] sm:min-h-[78px]">
            <div className="min-h-[22px] flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] sm:text-[11px] font-bold font-['Space_Mono'] uppercase tracking-[0.08em] text-[#B45309] dark:text-[#D4A843] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] dark:bg-[#D4A843] shrink-0 inline-block"></span>
                [ NEEDS LOWER ]
              </span>
            </div>
            <div className="mt-auto pt-1 flex items-baseline flex-wrap gap-x-2">
              <span className="font-['Doto'] font-bold text-2xl sm:text-3xl text-[#B45309] dark:text-[#D4A843] tracking-tight">
                {summary.measuredCount >= 2 ? summary.lowerCount : '—'}
              </span>
              <span className="text-[11px] font-semibold whitespace-nowrap font-['Space_Mono'] text-[#B45309]/80 dark:text-[#D4A843]/80 uppercase">
                {summary.measuredCount >= 2 && summary.maxLower > 0 ? (
                  `(Max -${project.unitFormat === 'decimal_inches'
                    ? `${summary.maxLower.toFixed(2)}"`
                    : project.unitFormat === 'metric_mm'
                    ? `${(summary.maxLower * 25.4).toFixed(1)}mm`
                    : project.fractionResolution === 16
                    ? `${Math.round(summary.maxLower * 16)}/16"`
                    : `${summary.maxLower.toFixed(2)}"`})`
                ) : summary.measuredCount < 2 ? (
                  '(Need ≥ 2)'
                ) : (
                  'pts'
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 gap-2.5 sm:gap-3">
      {/* Card 1: Track Length */}
      <div className="proto-card bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-2.5 sm:p-3 rounded-xl flex flex-col justify-between min-h-[74px] sm:min-h-[78px] shadow-xs">
        <div className="min-h-[24px] flex items-start justify-between gap-1 mb-1">
          <span className="text-[10px] sm:text-[11px] font-bold block text-zinc-400 dark:text-zinc-300 uppercase tracking-wider">
            Track Length
          </span>
          {summary.completedCount !== undefined && summary.completedCount > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.2 rounded whitespace-nowrap shrink-0 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
              title={`${summary.completedCount} of ${summary.totalStations} ties completed trackside`}
            >
              ✓ {summary.completedCount}/{summary.totalStations}
            </span>
          )}
        </div>
        <div className="mt-auto pt-1 flex items-baseline flex-wrap gap-x-1.5">
          <span className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
            {summary.lengthFt}
          </span>
          <span className="text-[11px] font-normal whitespace-nowrap text-zinc-500">
            ft ({summary.measuredCount}/{summary.totalStations} shot)
          </span>
        </div>
      </div>

      {/* Card 2: On Grade */}
      <div className="proto-card bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-2.5 sm:p-3 rounded-xl flex flex-col justify-between min-h-[74px] sm:min-h-[78px] shadow-xs">
        <div className="min-h-[24px] flex items-start justify-between gap-1 mb-1">
          <span className="text-[10px] sm:text-[11px] font-bold block text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            {`On Grade (${getToleranceLabel(project.toleranceInches, project.unitFormat)})`}
          </span>
        </div>
        <div className="mt-auto pt-1 flex items-baseline flex-wrap gap-x-1.5">
          <span className="text-lg sm:text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
            {summary.measuredCount >= 2
              ? `${Math.round((summary.onGradeCount / summary.measuredCount) * 100)}%`
              : '—'}
          </span>
          <span className="text-[11px] font-semibold whitespace-nowrap text-zinc-600 dark:text-zinc-400">
            {summary.measuredCount < 2 ? '(Need ≥ 2)' : `(${summary.onGradeCount} pts)`}
          </span>
        </div>
      </div>

      {/* Card 3: Needs Lift */}
      <div className="proto-card bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-2.5 sm:p-3 rounded-xl flex flex-col justify-between min-h-[74px] sm:min-h-[78px] shadow-xs">
        <div className="min-h-[24px] flex items-start justify-between gap-1 mb-1">
          <span className="text-[10px] sm:text-[11px] font-bold block text-sky-700 dark:text-sky-400 uppercase tracking-wider">
            Needs Lift (Low spots)
          </span>
        </div>
        <div className="mt-auto pt-1 flex items-baseline flex-wrap gap-x-1.5">
          <span className="text-lg sm:text-xl font-bold text-sky-700 dark:text-sky-400 font-mono">
            {summary.measuredCount >= 2 ? summary.liftCount : '—'}
          </span>
          <span className="text-[11px] font-semibold whitespace-nowrap text-sky-600 dark:text-sky-400">
            {summary.measuredCount >= 2 && summary.maxLift > 0 ? (
              `(Max +${project.unitFormat === 'decimal_inches'
                ? `${summary.maxLift.toFixed(2)}"`
                : project.unitFormat === 'metric_mm'
                ? `${(summary.maxLift * 25.4).toFixed(1)}mm`
                : project.fractionResolution === 16
                ? `${Math.round(summary.maxLift * 16)}/16"`
                : `${summary.maxLift.toFixed(2)}"`})`
            ) : summary.measuredCount < 2 ? (
              '(Need ≥ 2)'
            ) : (
              'pts'
            )}
          </span>
        </div>
      </div>

      {/* Card 4: Needs Lower */}
      <div className="proto-card bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-2.5 sm:p-3 rounded-xl flex flex-col justify-between min-h-[74px] sm:min-h-[78px] shadow-xs">
        <div className="min-h-[24px] flex items-start justify-between gap-1 mb-1">
          <span className="text-[10px] sm:text-[11px] font-bold block text-amber-800 dark:text-amber-400 uppercase tracking-wider">
            Needs Lower (High spots)
          </span>
        </div>
        <div className="mt-auto pt-1 flex items-baseline flex-wrap gap-x-1.5">
          <span className="text-lg sm:text-xl font-bold text-amber-800 dark:text-amber-400 font-mono">
            {summary.measuredCount >= 2 ? summary.lowerCount : '—'}
          </span>
          <span className="text-[11px] font-semibold whitespace-nowrap text-amber-700 dark:text-amber-400">
            {summary.measuredCount >= 2 && summary.maxLower > 0 ? (
              `(Max -${project.unitFormat === 'decimal_inches'
                ? `${summary.maxLower.toFixed(2)}"`
                : project.unitFormat === 'metric_mm'
                ? `${(summary.maxLower * 25.4).toFixed(1)}mm`
                : project.fractionResolution === 16
                ? `${Math.round(summary.maxLower * 16)}/16"`
                : `${summary.maxLower.toFixed(2)}"`})`
            ) : summary.measuredCount < 2 ? (
              '(Need ≥ 2)'
            ) : (
              'pts'
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export const StationAlignmentBar: React.FC<StationAlignmentBarProps> = ({
  project,
  onChangeProject,
  calculatedStations,
  prototypeStyle = 'original',
}) => {
  const gradeInfo = useMemo(() => {
    if (!calculatedStations) return null;
    return calculateGradeInfo(calculatedStations, project.gradeMode, project.targetGradePercent);
  }, [calculatedStations, project.gradeMode, project.targetGradePercent]);

  if (prototypeStyle === 'nothing') {
    return (
      <div
        data-tutorial="alignment-bar"
        className="proto-card bg-white dark:bg-[#000000] border border-zinc-300 dark:border-zinc-800 rounded-2xl p-2.5 sm:p-3 shadow-xs space-y-2.5 text-xs transition-colors"
      >
        {/* Tier 1: Target Grade Mode Selector & Readout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-['Space_Mono'] uppercase tracking-[0.08em] text-[10px] text-zinc-500 shrink-0">
              [ TARGET: ]
            </span>
            <div className="flex p-0.5 h-7 items-center rounded-full border border-zinc-300 dark:border-zinc-700 bg-transparent">
              <button
                type="button"
                onClick={() => onChangeProject({ gradeMode: 'target_grade' })}
                className={`h-full px-3 text-[10px] sm:text-[11px] font-bold font-['Space_Mono'] uppercase tracking-wider rounded-full transition ${
                  project.gradeMode === 'target_grade'
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
                title="Target a specific grade across the section (e.g. 0.0% flat)"
              >
                Grade %
              </button>
              <button
                type="button"
                onClick={() => onChangeProject({ gradeMode: 'end_to_end' })}
                className={`h-full px-3 text-[10px] sm:text-[11px] font-bold font-['Space_Mono'] uppercase tracking-wider rounded-full transition ${
                  project.gradeMode === 'end_to_end'
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
                title="Connect fixed benchmark ends and any locked control points (e.g. over tree roots)"
              >
                End-to-End
              </button>
            </div>
          </div>

          {/* Target Value or End-to-End Telemetry */}
          {project.gradeMode === 'target_grade' ? (
            <div className="flex items-center gap-1.5 font-['Space_Mono'] text-xs">
              <span className="text-[10px] uppercase text-zinc-500">GRADE:</span>
              <input
                type="number"
                step="0.1"
                value={project.targetGradePercent}
                onChange={(e) => onChangeProject({ targetGradePercent: parseFloat(e.target.value) || 0 })}
                className="w-12 font-mono font-bold bg-transparent text-zinc-900 dark:text-zinc-100 border-b border-zinc-400 dark:border-zinc-600 outline-none text-right text-xs"
              />
              <span className="text-zinc-500 text-xs">%</span>
              <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-zinc-200 dark:border-zinc-800">
                {[0.0, 0.5, 1.0, 1.5].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => onChangeProject({ targetGradePercent: g })}
                    className={`px-1.5 py-0.5 text-[10px] font-bold font-['Space_Mono'] rounded-full transition ${
                      project.targetGradePercent === g
                        ? 'bg-black text-white dark:bg-white dark:text-black'
                        : 'text-zinc-500 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {g}%
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 font-['Space_Mono'] text-xs">
              {!gradeInfo ? (
                <span className="text-[10px] uppercase text-zinc-500 italic">Grade: Need 2+ shots</span>
              ) : !gradeInfo.hasLockedPoints ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase text-zinc-500">SLOPE:</span>
                  <span className={`font-bold ${
                    gradeInfo.overallGradePercent > 0.05
                      ? 'text-[#5B9BF6]'
                      : gradeInfo.overallGradePercent < -0.05
                      ? 'text-[#D4A843]'
                      : 'text-[#4A9E5C]'
                  }`}>
                    {gradeInfo.overallGradePercent >= 0 ? '+' : ''}{gradeInfo.overallGradePercent.toFixed(2)}%
                  </span>
                  <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                    ({gradeInfo.overallElevChangeInches >= 0 ? '+' : ''}{gradeInfo.overallElevChangeInches.toFixed(2)}" / {gradeInfo.totalLengthFt}ft)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase text-zinc-500">NET:</span>
                  <span className={`font-bold ${
                    gradeInfo.overallGradePercent > 0.05 ? 'text-[#5B9BF6]' : gradeInfo.overallGradePercent < -0.05 ? 'text-[#D4A843]' : 'text-[#4A9E5C]'
                  }`}>
                    {gradeInfo.overallGradePercent >= 0 ? '+' : ''}{gradeInfo.overallGradePercent.toFixed(2)}%
                  </span>
                  <span className="text-[10px] text-zinc-500 font-bold whitespace-nowrap">
                    ({gradeInfo.segments.length} Chords)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tier 2: Station Interval & Units */}
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="font-['Space_Mono'] uppercase tracking-[0.08em] text-[10px] text-zinc-500 shrink-0">
              [ INTERVAL: ]
            </span>
            <select
              value={project.stationIntervalFt}
              onChange={(e) => onChangeProject({ stationIntervalFt: parseInt(e.target.value, 10) })}
              className="w-full h-7 px-2 font-['Space_Mono'] text-[11px] font-bold rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-black text-zinc-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="1">1 ft (fine)</option>
              <option value="2">2 ft</option>
              <option value="5">5 ft (standard)</option>
              <option value="10">10 ft</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="font-['Space_Mono'] uppercase tracking-[0.08em] text-[10px] text-zinc-500 shrink-0">
              [ UNITS: ]
            </span>
            <select
              value={project.unitFormat}
              onChange={(e) => onChangeProject({ unitFormat: e.target.value as UnitFormat })}
              className="w-full h-7 px-2 font-['Space_Mono'] text-[11px] font-bold rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-black text-zinc-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="feet_inches_fraction">Ft, In & 1/16"</option>
              <option value="inches_fraction">Inches & 1/16"</option>
              <option value="decimal_inches">Decimal In</option>
              <option value="metric_mm">Metric (mm)</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-tutorial="alignment-bar"
      className="proto-card bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2.5 sm:p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs transition-colors"
    >
      {/* Target Grade Mode Segmented Control */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-zinc-400 dark:text-zinc-300 tracking-wider text-[10px] font-bold uppercase shrink-0">
          Target:
        </span>
        <div className="flex p-0.5 h-8 items-center shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => onChangeProject({ gradeMode: 'target_grade' })}
            className={`h-full px-3 font-bold transition text-xs flex items-center ${
              project.gradeMode === 'target_grade'
                ? 'bg-zinc-900 dark:bg-zinc-800 text-white dark:text-amber-400 shadow-sm rounded-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 rounded-md'
            }`}
            title="Target a specific grade across the section (e.g. 0.0% flat)"
          >
            Grade %
          </button>
          <button
            type="button"
            onClick={() => onChangeProject({ gradeMode: 'end_to_end' })}
            className={`h-full px-3 font-bold transition text-xs flex items-center ${
              project.gradeMode === 'end_to_end'
                ? 'bg-zinc-900 dark:bg-zinc-800 text-white dark:text-amber-400 shadow-sm rounded-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 rounded-md'
            }`}
            title="Connect fixed benchmark ends and any locked control points (e.g. over tree roots)"
          >
            End-to-End
          </button>
        </div>

        {/* If Grade % is selected, show grade input */}
        {project.gradeMode === 'target_grade' && (
          <div className="flex items-center gap-1.5 px-2.5 h-8 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-500 font-medium text-xs">
              Grade:
            </span>
            <div className="flex items-center">
              <input
                type="number"
                step="0.1"
                value={project.targetGradePercent}
                onChange={(e) => onChangeProject({ targetGradePercent: parseFloat(e.target.value) || 0 })}
                className="w-11 font-mono font-bold bg-transparent text-zinc-900 dark:text-zinc-100 outline-none text-right text-xs"
              />
              <span className="font-bold text-zinc-500 ml-0.5 text-xs">%</span>
            </div>
            <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-zinc-200 dark:border-zinc-800">
              {[0.0, 0.5, 1.0, 1.5].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => onChangeProject({ targetGradePercent: g })}
                  className={`px-1.5 py-0.5 text-[10px] font-bold transition ${
                    project.targetGradePercent === g
                      ? 'bg-amber-500 text-black shadow-xs rounded'
                      : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded'
                  }`}
                >
                  {g}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* If End-to-End is selected, show resulting grade readout */}
        {project.gradeMode === 'end_to_end' && (
          <div className="flex items-center gap-1.5 px-2.5 h-8 text-xs shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            {!gradeInfo ? (
              <div className="flex items-center gap-1 text-zinc-500 font-medium whitespace-nowrap shrink-0">
                <TrendingUp className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>Grade:</span>
                <span className="italic text-[11px] text-zinc-400">Need 2+ shots</span>
              </div>
            ) : !gradeInfo.hasLockedPoints ? (
              <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-zinc-500 font-medium">Grade:</span>
                <span className={`font-mono font-bold ${
                  gradeInfo.overallGradePercent > 0.05
                    ? 'text-sky-600 dark:text-sky-400'
                    : gradeInfo.overallGradePercent < -0.05
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {gradeInfo.overallGradePercent >= 0 ? '+' : ''}{gradeInfo.overallGradePercent.toFixed(2)}%
                </span>
                <span className="text-[11px] text-zinc-500 font-medium hidden sm:inline">
                  ({gradeInfo.overallElevChangeInches >= 0 ? '+' : ''}{gradeInfo.overallElevChangeInches.toFixed(2)}" over {gradeInfo.totalLengthFt}ft)
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex items-center gap-1 whitespace-nowrap shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-zinc-500 font-medium">Net:</span>
                  <span className={`font-mono font-bold ${
                    gradeInfo.overallGradePercent > 0.05
                      ? 'text-sky-600 dark:text-sky-400'
                      : gradeInfo.overallGradePercent < -0.05
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`} title="Net straight-line grade between first and last tie">
                    {gradeInfo.overallGradePercent >= 0 ? '+' : ''}{gradeInfo.overallGradePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center gap-1 pl-1.5 border-l border-zinc-200 dark:border-zinc-800 flex-wrap">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 hidden xs:inline whitespace-nowrap">
                    {gradeInfo.segments.length} Chords:
                  </span>
                  {gradeInfo.segments.map((seg, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold whitespace-nowrap shrink-0"
                      title={`Chord ${idx + 1} (${seg.startDistanceFt}'-${seg.endDistanceFt}'): ${seg.gradePercent >= 0 ? '+' : ''}${seg.gradePercent.toFixed(2)}% (${seg.elevChangeInches >= 0 ? '+' : ''}${seg.elevChangeInches.toFixed(2)}" over ${seg.lengthFt}ft)`}
                    >
                      {seg.startDistanceFt}'-{seg.endDistanceFt}': <strong className={seg.gradePercent > 0.05 ? 'text-sky-500 dark:text-sky-400' : seg.gradePercent < -0.05 ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'}>{seg.gradePercent >= 0 ? '+' : ''}{seg.gradePercent.toFixed(2)}%</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Station Interval & Units */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400 dark:text-zinc-300 tracking-wider font-bold uppercase text-[10px] shrink-0">
            Interval:
          </span>
          <select
            value={project.stationIntervalFt}
            onChange={(e) => onChangeProject({ stationIntervalFt: parseInt(e.target.value, 10) })}
            className="h-8 px-2.5 font-bold text-xs outline-none cursor-pointer rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
          >
            <option value="1">1 ft (fine)</option>
            <option value="2">2 ft</option>
            <option value="5">5 ft (standard)</option>
            <option value="10">10 ft</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400 dark:text-zinc-300 tracking-wider font-bold uppercase text-[10px] shrink-0">
            Units:
          </span>
          <select
            value={project.unitFormat}
            onChange={(e) => onChangeProject({ unitFormat: e.target.value as UnitFormat })}
            className="h-8 px-2.5 font-bold text-xs outline-none cursor-pointer rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
          >
            <option value="feet_inches_fraction">Ft, In & 1/16"</option>
            <option value="inches_fraction">Inches & 1/16"</option>
            <option value="decimal_inches">Decimal In</option>
            <option value="metric_mm">Metric (mm)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export interface StationConfigProps
  extends StationConfigHeaderProps,
    StationSummaryBarProps,
    StationAlignmentBarProps {}

export const StationConfig: React.FC<StationConfigProps> = (props) => {
  return (
    <div className="space-y-2.5">
      <StationConfigHeader {...props} />
      <StationSummaryBar {...props} />
      <StationAlignmentBar {...props} />
    </div>
  );
};
