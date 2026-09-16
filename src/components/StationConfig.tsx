import React, { useState, useEffect, useMemo } from 'react';
import { UnitFormat, TrackProject, CalculatedStation } from '../core/types';
import { calculateGradeInfo } from '../core/calculations';
import { Sliders, Sun, Moon, Compass, BookOpen, WifiOff, CheckCircle2, TrendingUp, Plus, Download, Settings, Play } from 'lucide-react';
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
}

export interface StationSummaryBarProps {
  project: TrackProject;
  summary: StationSummaryData;
}

export interface StationAlignmentBarProps {
  project: TrackProject;
  onChangeProject: (updated: Partial<TrackProject>) => void;
  calculatedStations?: CalculatedStation[];
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
    <header className="bg-white dark:bg-black text-zinc-900 dark:text-white rounded-2xl p-2.5 sm:p-3 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2.5 transition-colors">
      {/* Title & Theme Toggle Row */}
      <div className="flex items-center justify-between w-full gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 dark:bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-500 shadow-sm shrink-0">
            <Compass className="w-4.5 h-4.5 stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={project.name}
                onChange={(e) => onChangeProject({ name: e.target.value })}
                className="bg-transparent font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 focus:bg-zinc-100 dark:focus:bg-zinc-900 rounded px-1 -ml-1 py-0.5 outline-none transition w-full truncate"
                placeholder="Track Section Name"
                title="Click to rename track section"
              />
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-300 font-medium truncate">
              <span className="truncate">{summary.lengthFt} ft Section</span>
              <span>•</span>
              {!isOnline ? (
                <span
                  className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                  title="Offline mode: all changes persist in browser storage"
                >
                  <WifiOff className="w-3 h-3 text-amber-500" />
                  <span>Offline</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleCheckForUpdates}
                  className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition cursor-pointer whitespace-nowrap"
                  title="Service Worker active (offline ready). Tap to check for app updates."
                >
                  <CheckCircle2 className={`w-3 h-3 text-emerald-500 ${updateStatus === 'checking' ? 'animate-spin' : ''}`} />
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

        {/* Theme Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="h-8 w-8 flex items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition active:scale-95 text-zinc-700 dark:text-zinc-300 shrink-0"
          title={isDarkMode ? 'Switch to Bright Sunlight Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Sunlight Mode"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-600" />
          )}
        </button>
      </div>

      {/* Action Controls */}
      <div data-tutorial="header-actions" className="flex items-center gap-1.5 w-full flex-wrap">
        {/* Desktop / PWA Install Button */}
        {canInstall && onInstallApp && (
          <button
            type="button"
            onClick={onInstallApp}
            className="flex-1 h-8 flex items-center justify-center gap-1 px-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition shadow-sm active:scale-95 whitespace-nowrap"
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
          className="flex-1 h-8 flex items-center justify-center gap-1 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition shadow-sm active:scale-95 whitespace-nowrap"
          title="Start New Track (Blank, Pre-Generated Grid, or Clear Readings)"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3] shrink-0" />
          <span>New</span>
        </button>

        {/* Interactive Tutorials */}
        {onStartTutorial && (
          <button
            type="button"
            onClick={onStartTutorial}
            className="flex-1 h-8 flex items-center justify-center gap-1 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 text-xs font-bold transition border border-amber-500/30 active:scale-95 whitespace-nowrap"
            title="Open Interactive Tutorials"
          >
            <Play className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
            <span>Tutorials</span>
          </button>
        )}

        {/* Field Guide / Handbook */}
        <button
          type="button"
          onClick={onOpenGuideModal}
          className="flex-1 h-8 flex items-center justify-center gap-1 px-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition border border-zinc-200 dark:border-zinc-800 active:scale-95 whitespace-nowrap"
          title="Open Field Guide & Feature Handbook"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Guide</span>
        </button>

        {/* Data / Files */}
        <button
          type="button"
          onClick={onOpenDataModal}
          data-tutorial="header-files-btn"
          className="flex-1 h-8 flex items-center justify-center gap-1 px-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition border border-zinc-200 dark:border-zinc-800 active:scale-95 whitespace-nowrap"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Files</span>
        </button>

        {/* Settings */}
        {onOpenSettingsModal && (
          <button
            type="button"
            onClick={onOpenSettingsModal}
            className="flex-1 h-8 flex items-center justify-center gap-1 px-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition border border-zinc-200 dark:border-zinc-800 active:scale-95 whitespace-nowrap"
            title="Open App Settings (Grade Tolerance, Keypad Resolution, Default Units)"
          >
            <Settings className="w-3.5 h-3.5 text-amber-500 shrink-0" />
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

export const StationSummaryBar: React.FC<StationSummaryBarProps> = ({ project, summary }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 gap-2.5 sm:gap-3">
      <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-2.5 sm:p-3 rounded-xl flex flex-col justify-between min-h-[74px] sm:min-h-[78px] shadow-xs">
        <div className="min-h-[24px] flex items-start justify-between gap-1 mb-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-wider block">
            Track Length
          </span>
          {summary.completedCount !== undefined && summary.completedCount > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 whitespace-nowrap shrink-0"
              title={`${summary.completedCount} of ${summary.totalStations} ties completed trackside`}
            >
              ✓ {summary.completedCount}/{summary.totalStations}
            </span>
          )}
        </div>
        <div className="text-lg sm:text-xl font-mono font-bold text-zinc-900 dark:text-zinc-100 mt-auto pt-1 flex items-baseline flex-wrap gap-x-1.5">
          <span>{summary.lengthFt} ft</span>
          <span className="text-[11px] text-zinc-500 font-normal whitespace-nowrap">
            ({summary.measuredCount}/{summary.totalStations} shot)
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-2.5 sm:p-3 rounded-xl flex flex-col justify-between min-h-[74px] sm:min-h-[78px] shadow-xs">
        <div className="min-h-[24px] flex items-start justify-between gap-1 mb-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
            On Grade ({getToleranceLabel(project.toleranceInches, project.unitFormat)})
          </span>
        </div>
        <div className="text-lg sm:text-xl font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-auto pt-1 flex items-baseline flex-wrap gap-x-1.5">
          <span>
            {summary.measuredCount >= 2
              ? `${Math.round((summary.onGradeCount / summary.measuredCount) * 100)}%`
              : '—'}
          </span>
          <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold whitespace-nowrap">
            {summary.measuredCount < 2 ? '(Need ≥ 2)' : `(${summary.onGradeCount} pts)`}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-2.5 sm:p-3 rounded-xl flex flex-col justify-between min-h-[74px] sm:min-h-[78px] shadow-xs">
        <div className="min-h-[24px] flex items-start justify-between gap-1 mb-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider block">
            Needs Lift (Low spots)
          </span>
        </div>
        <div className="text-lg sm:text-xl font-mono font-bold text-sky-700 dark:text-sky-400 mt-auto pt-1 flex items-baseline flex-wrap gap-x-1.5">
          <span>{summary.measuredCount >= 2 ? `${summary.liftCount} pts` : '—'}</span>
          {summary.measuredCount >= 2 && summary.maxLift > 0 && (
            <span className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold whitespace-nowrap">
              (Max +{project.unitFormat === 'decimal_inches'
                ? `${summary.maxLift.toFixed(2)}"`
                : project.unitFormat === 'metric_mm'
                ? `${(summary.maxLift * 25.4).toFixed(1)}mm`
                : project.fractionResolution === 16
                ? `${Math.round(summary.maxLift * 16)}/16"`
                : `${summary.maxLift.toFixed(2)}"`})
            </span>
          )}
          {summary.measuredCount < 2 && (
            <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-normal whitespace-nowrap">
              (Need ≥ 2)
            </span>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-2.5 sm:p-3 rounded-xl flex flex-col justify-between min-h-[74px] sm:min-h-[78px] shadow-xs">
        <div className="min-h-[24px] flex items-start justify-between gap-1 mb-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
            Needs Lower (High spots)
          </span>
        </div>
        <div className="text-lg sm:text-xl font-mono font-bold text-amber-800 dark:text-amber-400 mt-auto pt-1 flex items-baseline flex-wrap gap-x-1.5">
          <span>{summary.measuredCount >= 2 ? `${summary.lowerCount} pts` : '—'}</span>
          {summary.measuredCount >= 2 && summary.maxLower > 0 && (
            <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold whitespace-nowrap">
              (Max -{project.unitFormat === 'decimal_inches'
                ? `${summary.maxLower.toFixed(2)}"`
                : project.unitFormat === 'metric_mm'
                ? `${(summary.maxLower * 25.4).toFixed(1)}mm`
                : project.fractionResolution === 16
                ? `${Math.round(summary.maxLower * 16)}/16"`
                : `${summary.maxLower.toFixed(2)}"`})
            </span>
          )}
          {summary.measuredCount < 2 && (
            <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-normal whitespace-nowrap">
              (Need ≥ 2)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const StationAlignmentBar: React.FC<StationAlignmentBarProps> = ({
  project,
  onChangeProject,
  calculatedStations,
}) => {
  const gradeInfo = useMemo(() => {
    if (!calculatedStations) return null;
    return calculateGradeInfo(calculatedStations, project.gradeMode, project.targetGradePercent);
  }, [calculatedStations, project.gradeMode, project.targetGradePercent]);

  return (
    <div
      data-tutorial="alignment-bar"
      className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-2.5 text-xs transition-colors"
    >
      {/* Grade Mode Selection */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-wider text-[10px] shrink-0">
          Target:
        </span>
        <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-900 p-0.5 border border-zinc-200 dark:border-zinc-800 h-8 items-center shrink-0">
          <button
            type="button"
            onClick={() => onChangeProject({ gradeMode: 'target_grade' })}
            className={`h-full px-3 rounded-md font-bold transition text-xs flex items-center ${
              project.gradeMode === 'target_grade'
                ? 'bg-zinc-900 dark:bg-zinc-800 text-white dark:text-amber-400 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
            title="Target a specific grade across the section (e.g. 0.0% flat)"
          >
            Grade %
          </button>
          <button
            type="button"
            onClick={() => onChangeProject({ gradeMode: 'end_to_end' })}
            className={`h-full px-3 rounded-md font-bold transition text-xs flex items-center ${
              project.gradeMode === 'end_to_end'
                ? 'bg-zinc-900 dark:bg-zinc-800 text-white dark:text-amber-400 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
            title="Connect fixed benchmark ends and any locked control points (e.g. over tree roots)"
          >
            End-to-End
          </button>
        </div>

        {/* If Grade % is selected, show grade input */}
        {project.gradeMode === 'target_grade' && (
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 h-8 shrink-0">
            <span className="text-zinc-500 font-medium text-xs">Grade:</span>
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
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition ${
                    project.targetGradePercent === g
                      ? 'bg-amber-500 text-black shadow-xs'
                      : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700'
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
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 h-8 text-xs shrink-0">
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
          <span className="font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-wider text-[10px] shrink-0">
            Interval:
          </span>
          <select
            value={project.stationIntervalFt}
            onChange={(e) => onChangeProject({ stationIntervalFt: parseInt(e.target.value, 10) })}
            className="h-8 px-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold text-xs text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer"
          >
            <option value="1">1 ft (fine)</option>
            <option value="2">2 ft</option>
            <option value="5">5 ft (standard)</option>
            <option value="10">10 ft</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-wider text-[10px] shrink-0">
            Units:
          </span>
          <select
            value={project.unitFormat}
            onChange={(e) => onChangeProject({ unitFormat: e.target.value as UnitFormat })}
            className="h-8 px-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold text-xs text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer"
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
