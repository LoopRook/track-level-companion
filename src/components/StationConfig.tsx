import { UnitFormat, TrackProject } from '../core/types';
import { Sliders, Sun, Moon } from 'lucide-react';

interface StationConfigProps {
  project: TrackProject;
  onChangeProject: (updated: Partial<TrackProject>) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenDataModal: () => void;
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
  summary,
}) => {
  return (
    <div className="space-y-3">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold shadow-md">
            🚂
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={project.name}
                onChange={(e) => onChangeProject({ name: e.target.value })}
                className="bg-transparent font-extrabold text-lg sm:text-xl text-white hover:bg-slate-800/80 focus:bg-slate-800 rounded px-1.5 -ml-1.5 py-0.5 outline-none transition"
                placeholder="Track Section Name"
              />
              <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold">
                {project.gauge}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live Steam Track Level Companion • {summary.lengthFt} ft Section
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Data / Files */}
          <button
            onClick={onOpenDataModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 active:scale-95"
          >
            <Sliders className="w-4 h-4" />
            <span>Manage / Export</span>
          </button>

          {/* Theme Toggle (Sunlight mode) */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 active:scale-95"
            title={isDarkMode ? 'Switch to Sunlight / Bright Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
          </button>
        </div>
      </header>

      {/* Real-time Field Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Track Length
          </span>
          <div className="text-xl font-mono font-bold text-slate-800 dark:text-slate-100 mt-0.5">
            {summary.lengthFt} ft
            <span className="text-xs text-slate-400 font-normal ml-2">
              ({summary.measuredCount}/{summary.totalStations} shot)
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            On Grade (Within {project.fractionResolution === 16 ? '1/16"' : '1/8"'})
          </span>
          <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {summary.measuredCount > 0
              ? `${Math.round((summary.onGradeCount / summary.measuredCount) * 100)}%`
              : '—'}
            <span className="text-xs text-slate-400 font-normal ml-2">
              ({summary.onGradeCount} pts)
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
            Needs Lift (Low spots)
          </span>
          <div className="text-xl font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">
            {summary.liftCount} pts
            {summary.maxLift > 0 && (
              <span className="text-xs text-blue-500 font-normal ml-2">
                (Max +{project.fractionResolution === 16 ? `${Math.round(summary.maxLift * 16)}/16"` : `${summary.maxLift.toFixed(2)}"`})
              </span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Needs Lower (High spots)
          </span>
          <div className="text-xl font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {summary.lowerCount} pts
            {summary.maxLower > 0 && (
              <span className="text-xs text-amber-500 font-normal ml-2">
                (Max -{project.fractionResolution === 16 ? `${Math.round(summary.maxLower * 16)}/16"` : `${summary.maxLower.toFixed(2)}"`})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alignment & Configuration Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Grade Mode Selection */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
            Target Mode:
          </span>
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onChangeProject({ gradeMode: 'target_grade' })}
              className={`px-2.5 py-1 rounded-md font-bold transition ${
                project.gradeMode === 'target_grade'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Grade %
            </button>
            <button
              onClick={() => onChangeProject({ gradeMode: 'end_to_end' })}
              className={`px-2.5 py-1 rounded-md font-bold transition ${
                project.gradeMode === 'end_to_end'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              End-to-End
            </button>
            <button
              onClick={() => onChangeProject({ gradeMode: 'best_fit' })}
              className={`px-2.5 py-1 rounded-md font-bold transition ${
                project.gradeMode === 'best_fit'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Best-Fit Line
            </button>
            <button
              onClick={() => onChangeProject({ gradeMode: 'smooth_curve' })}
              className={`px-2.5 py-1 rounded-md font-bold transition ${
                project.gradeMode === 'smooth_curve'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Smooth Curve
            </button>
          </div>

          {/* If Grade % is selected, show slope input */}
          {project.gradeMode === 'target_grade' && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 font-medium">Slope:</span>
              <input
                type="number"
                step="0.1"
                value={project.targetGradePercent}
                onChange={(e) => onChangeProject({ targetGradePercent: parseFloat(e.target.value) || 0 })}
                className="w-14 font-mono font-bold bg-transparent text-slate-800 dark:text-slate-100 outline-none text-right"
              />
              <span className="font-bold text-slate-500">%</span>
              <div className="flex gap-1 ml-1">
                {[0.0, 0.5, 1.0, 1.5].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => onChangeProject({ targetGradePercent: g })}
                    className={`px-1.5 py-0.5 text-[10px] rounded ${
                      project.targetGradePercent === g
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
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
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Interval:</span>
            <select
              value={project.stationIntervalFt}
              onChange={(e) => onChangeProject({ stationIntervalFt: parseInt(e.target.value, 10) })}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-bold text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="1">1 ft (fine)</option>
              <option value="2">2 ft</option>
              <option value="5">5 ft (standard)</option>
              <option value="10">10 ft (fast)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Units:</span>
            <select
              value={project.unitFormat}
              onChange={(e) => onChangeProject({ unitFormat: e.target.value as UnitFormat })}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-bold text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="feet_inches_fraction">Ft, In & 1/16"</option>
              <option value="inches_fraction">Total Inches & 1/16"</option>
              <option value="decimal_inches">Decimal Inches</option>
              <option value="metric_mm">Metric (mm)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
