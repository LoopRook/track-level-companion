import React from 'react';
import { UnitFormat, TrackProject } from '../core/types';
import { Sliders, Sun, Moon, Compass, BookOpen } from 'lucide-react';

interface StationConfigProps {
  project: TrackProject;
  onChangeProject: (updated: Partial<TrackProject>) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenDataModal: () => void;
  onOpenGuideModal: () => void;
  summary: {
    totalStations: number;
    measuredCount: number;
    onGradeCount: number;
    liftCount: number;
    lowerCount: number;
    maxLift: number;
    maxLower: number;
    lengthFt: number;
  };
}

export const StationConfig: React.FC<StationConfigProps> = ({
  project,
  onChangeProject,
  isDarkMode,
  onToggleDarkMode,
  onOpenDataModal,
  onOpenGuideModal,
  summary,
}) => {
  return (
    <div className="space-y-2.5">
      {/* Top Navbar */}
      <header className="bg-white dark:bg-black text-zinc-900 dark:text-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 dark:bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-500 shadow-sm">
            <Compass className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={project.name}
                onChange={(e) => onChangeProject({ name: e.target.value })}
                className="bg-transparent font-extrabold text-base sm:text-lg text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 focus:bg-zinc-100 dark:focus:bg-zinc-900 rounded px-1.5 -ml-1.5 py-0.5 outline-none transition"
                placeholder="Track Section Name"
              />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Track Level Companion • {summary.lengthFt} ft Section
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Field Guide / Tutorial */}
          <button
            type="button"
            onClick={onOpenGuideModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 text-xs font-bold transition border border-amber-500/30 active:scale-95"
            title="Open Field Guide & Feature Tutorial"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <span>Guide</span>
          </button>

          {/* Data / Files */}
          <button
            type="button"
            onClick={onOpenDataModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition border border-zinc-200 dark:border-zinc-800 active:scale-95"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            <span>Files / Export</span>
          </button>

          {/* Theme Toggle (Sunlight mode) */}
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition border border-zinc-200 dark:border-zinc-800 active:scale-95"
            title={isDarkMode ? 'Switch to Bright Daylight Mode' : 'Switch to Pure Black Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
          </button>
        </div>
      </header>

      {/* Real-time Field Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl">
          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
            Track Length
          </span>
          <div className="text-lg font-mono font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
            {summary.lengthFt} ft
            <span className="text-[11px] text-zinc-500 font-normal ml-1.5">
              ({summary.measuredCount}/{summary.totalStations})
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            On Grade (Within {project.fractionResolution === 16 ? '1/16"' : '1/8"'})
          </span>
          <div className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {summary.measuredCount > 0
              ? `${Math.round((summary.onGradeCount / summary.measuredCount) * 100)}%`
              : '—'}
            <span className="text-[11px] text-zinc-500 font-normal ml-1.5">
              ({summary.onGradeCount} pts)
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl">
          <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">
            Needs Lift (Low spots)
          </span>
          <div className="text-lg font-mono font-bold text-sky-600 dark:text-sky-400 mt-0.5">
            {summary.liftCount} pts
            {summary.maxLift > 0 && (
              <span className="text-[11px] text-sky-500 dark:text-sky-400 font-normal ml-1.5">
                (Max +{project.fractionResolution === 16 ? `${Math.round(summary.maxLift * 16)}/16"` : `${summary.maxLift.toFixed(2)}"`})
              </span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Needs Lower (High spots)
          </span>
          <div className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {summary.lowerCount} pts
            {summary.maxLower > 0 && (
              <span className="text-[11px] text-amber-500 dark:text-amber-400 font-normal ml-1.5">
                (Max -{project.fractionResolution === 16 ? `${Math.round(summary.maxLower * 16)}/16"` : `${summary.maxLower.toFixed(2)}"`})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alignment & Configuration Bar */}
      <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2.5 sm:p-3 shadow-sm flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Grade Mode Selection */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
            Target:
          </span>
          <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-900 p-0.5 border border-zinc-200 dark:border-zinc-800 h-8 items-center">
            <button
              type="button"
              onClick={() => onChangeProject({ gradeMode: 'target_grade' })}
              className={`h-full px-3 rounded-md font-bold transition text-xs flex items-center ${
                project.gradeMode === 'target_grade'
                  ? 'bg-zinc-900 dark:bg-zinc-800 text-white dark:text-amber-400 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              title="Target a specific grade or slope across the section (e.g. 0.0% flat)"
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

          {/* If Grade % is selected, show slope input */}
          {project.gradeMode === 'target_grade' && (
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 h-8">
              <span className="text-zinc-500 font-medium text-xs">Slope:</span>
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
        </div>

        {/* Station Interval & Units */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 font-medium">Interval:</span>
            <select
              value={project.stationIntervalFt}
              onChange={(e) => onChangeProject({ stationIntervalFt: parseInt(e.target.value, 10) })}
              className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 font-bold text-zinc-900 dark:text-zinc-100 outline-none"
            >
              <option value="1">1 ft (fine)</option>
              <option value="2">2 ft</option>
              <option value="5">5 ft (standard)</option>
              <option value="10">10 ft</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 font-medium">Units:</span>
            <select
              value={project.unitFormat}
              onChange={(e) => onChangeProject({ unitFormat: e.target.value as UnitFormat })}
              className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 font-bold text-zinc-900 dark:text-zinc-100 outline-none"
            >
              <option value="feet_inches_fraction">Ft, In & 1/16"</option>
              <option value="inches_fraction">Inches & 1/16"</option>
              <option value="decimal_inches">Decimal In</option>
              <option value="metric_mm">Metric (mm)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
